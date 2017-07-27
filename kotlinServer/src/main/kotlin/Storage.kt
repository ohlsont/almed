import com.google.appengine.api.datastore.Entity
import com.google.appengine.repackaged.com.google.gson.Gson

interface Storeable {
    val id: String
    val entity: Entity
        get() {
            val json = Gson().toJson(this)
            val entity = entityId(this.id)
            entity.setProperty(dataProp, json)
            return entity
        }

    fun save() {
        println("storing $id")
        store.put(entity)
    }

    fun delete() {
        store.delete(entityId(id).key)
    }

    companion object {
        fun entityId(id: String) = Entity(evsKey, id)
        inline fun <reified T> get(id: String): T? {
            val entity = store.get(entityId(id).key)
            val objectJson: String? = entity.getProperty(dataProp) as? String
            val unwrappedString: String = objectJson?.let { it } ?: return null

            return Gson().fromJson<T>(unwrappedString)
        }
    }
}

fun <T: Storeable> Iterable<T>.bulkSave() {
    val ents = this.map { item: Storeable -> item.entity }
    store.put(ents)
}

fun Any.json(): String = Gson().toJson(this)

inline fun <reified T> String.json(): T {
    return  Gson().fromJson<T>(this)
}