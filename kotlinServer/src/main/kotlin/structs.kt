import com.google.appengine.api.datastore.DatastoreServiceFactory
import com.google.appengine.repackaged.com.google.gson.Gson

data class AlmedParticipant(
        val name: String,
        val title: String,
        val company: String
)

fun <T> Sequence<T>.batch(n: Int): Sequence<List<T>> {
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

inline fun <reified T> Gson.fromJson(json: String): T = this.fromJson<T>(json, T::class.java)

val evsKey = "AlmedEvent"
val dataProp = "data"
val store = DatastoreServiceFactory.getDatastoreService()

data class AlmedEvent(
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
        val url: String,
        override val id: String
) : Storeable

data class MapPoints(
        val result: Array<MapPoint>
)

data class MapPoint(
        val id: String,
        val PLACE: String,
        val PLACE_DESCRIPTION: String,
        val LONGITUDE: String,
        val LATITUDE: String
)
