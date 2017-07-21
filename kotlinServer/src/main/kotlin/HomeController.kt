import spark.kotlin.Http
import spark.kotlin.ignite
import spark.servlet.SparkApplication

/**
 * Example usage of spark-kotlin.
 * See https://github.com/perwendel/spark-kotlin
 */
class HomeController : SparkApplication {
    override fun init() {
        val http: Http = ignite()

        http.get("/") {
            """Hello Spark Kotlin running on Java8 App Engine Standard.
            <p>You can try /hello<p> or /saymy/:name<p> or redirect
            <p>or /nothing"""
        }
        http.get("/hello") {
            "Hello Spark Kotlin running on Java8 App Engine Standard."
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