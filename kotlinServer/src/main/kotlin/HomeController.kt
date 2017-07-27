import spark.kotlin.Http
import spark.kotlin.ignite
import spark.servlet.SparkApplication

class HomeController : SparkApplication {
    override fun init() {
        val http: Http = ignite()

        http.get("/") {
            """Hello Spark Kotlin running on Java8 App Engine Standard.
            <p>You can try /hello<p> or /saymy/:name<p> or redirect
            <p>or /nothing"""
        }
        http.get("/remoteItem/:id") {
            val id = params("id")
            println("go id $id")
            try {
                val mapPoints = Almed.getMapPoints()?.map { it.id to it }?.toMap() ?: mutableMapOf<String, MapPoint>()
                println("go points $mapPoints")
                val item = Almed.getItem("item/$id", mapPoints)
                println("go items $item")
                if (item == null) {
                    response.body("could not find $id")
                    status(404)
                } else {
                    status(200)
                    item.json()
                }
            } catch (err: Error) {
                println("bad $err")
                status(500)
            }
        }

        http.get("/nothing") {
            status(404)
            "Oops, we couldn't find what you're looking for."
        }

        http.get("/saymy/:name") {
            params(":name")
        }

        http.get("/redirect") {
            redirect("/hello");
        }
    }
}