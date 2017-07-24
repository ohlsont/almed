import com.github.kittinunf.fuel.core.ResponseDeserializable
import com.google.appengine.api.datastore.DatastoreServiceFactory
import com.google.appengine.api.datastore.Entity
import com.google.appengine.repackaged.com.google.gson.Gson

data class AlmedParticipant(
        val name: String,
        val title: String,
        val company: String
)

public fun <T> Sequence<T>.batch(n: Int): Sequence<List<T>> {
    return BatchingSequence(this, n)
}

private class BatchingSequence<T>(val source: Sequence<T>, val batchSize: Int) : Sequence<List<T>> {
    override fun iterator(): Iterator<List<T>> = object : AbstractIterator<List<T>>() {
        val iterate = if (batchSize > 0) source.iterator() else emptyList<T>().iterator()
        override fun computeNext() {
            if (iterate.hasNext()) setNext(iterate.asSequence().take(batchSize).toList())
            else done()
        }
    }
}

inline fun <reified T> Gson.fromJson(json: String) : T = this.fromJson<T>(json, T::class.java)

val evsKey = "AlmedEvent"
val dataProp = "data"
val store = DatastoreServiceFactory.getDatastoreService()
data class AlmedEvent(
        val id: String,
        val title: String,
        val organiser: String,
        val date: String?,
        val endDate: String?,
        val type: String,
        val subject: List<String>,
        val language: String,
        val location: String,
        val locationDescription: String,
        val description: String,
        val latitude: Double,
        val longitude: Double,
        val participants: Array<AlmedParticipant>,
        val parties: Array<String>,
        val green: Boolean,
        val availabilty: String,
        val live: Boolean,
        val food: Boolean,
        val web: Array<String>,
        val url: String
) {
    fun save() = save(this)

    val entity: Entity
        get() {
            val json = Gson().toJson(this)
            val entity = ev(this.id)
            entity.setProperty(dataProp, json)
            return entity
        }

    companion object {
        fun ev(id: String) = Entity(evsKey, id)
        fun get(id: String): AlmedEvent? {
            val entity = store.get(ev(id).key)
            val objectJson: String? = entity.getProperty(dataProp) as? String
            val unwrappedString: String = objectJson?.let { it } ?: return null

            return Gson().fromJson<AlmedEvent>(unwrappedString)
        }

        fun save(almedEv: AlmedEvent) {
            store.put(almedEv.entity)
        }

        fun bulkSave(evs: Array<AlmedEvent>) {
            val ents = evs.map { it.entity }
            store.put(ents)
        }

        fun delete(id: String) {
            store.delete(ev(id).key)
        }
    }

    class Deserializer : ResponseDeserializable<AlmedEvent> {
        override fun deserialize(content: String) = Gson().fromJson<AlmedEvent>(content)
    }
}

data class MapPoints(
        val result: Array<MapPoint>
) {
    class Deserializer : ResponseDeserializable<MapPoints> {
        override fun deserialize(content: String) = Gson().fromJson<MapPoints>(content)
    }
}

data class MapPoint(
        val id: String,
        val PLACE: String,
        val PLACE_DESCRIPTION: String,
        val LONGITUDE: String,
        val LATITUDE: String
) {
    class Deserializer : ResponseDeserializable<MapPoint> {
        override fun deserialize(content: String) = Gson().fromJson<MapPoint>(content)
    }
}
