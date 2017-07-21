import com.github.kittinunf.fuel.core.FuelManager
import com.github.kittinunf.fuel.httpPost
import java.io.ByteArrayInputStream
import javax.xml.parsers.DocumentBuilderFactory

data class MapPoint(
    val id: String,
    val PLACE: String,
    val PLACE_DESCRIPTION: String,
    val LONGITUDE: String,
    val LATITUDE: String
    )

data class HTMLTreeChildAttrs(
        val id: String,
        val titel: String,
        val href: String
)

data class HTMLTreeChild(
        val type: String?,
        val tagName: String?,
        val content: String?,
        val className: Array<String>?,
        val attributes: HTMLTreeChildAttrs,
        val children: Array<HTMLTreeChild>
)


class Almed {

    /*
    export async function getIds(): Promise<Array<string>> {
  const url = 'https://almedalsguiden.com/main/search'
  console.log('requesting', url)
  const resp = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Access-Control-Allow-Origin': '*',
    },
    body: 'search=S%C3%B6k&' +
    'freetext=&' +
    'date_from=2017-07-02&' +
    'date_to=2017-07-09&' +
    'subject=&' +
    'event_form=&' +
    'eventType=&' +
    'organizer=&' +
    'orgtype=&' +
    'place=&' +
    'language=&' +
    'status=&' +
    'accessibility=',
  })
  console.log('got response', url)

  switch (resp.status) {
    case 204:
      return []
    case 401:
      throw new Error('bad permissions, 401 response code')
    default:
      break
  }
  const res = await resp.text()
  const json = himalaya.parse(res)

  const elements = applyChildren(json[2], [3,5,5,1,3], false).children
  return [...new Set(elements.map(elem => elem.attributes ? elem.attributes.href : null).filter(Boolean))]
}
     */
    companion object {
        fun getIds() {
            FuelManager.instance.baseHeaders = mapOf(
                    "Content-Type" to "application/x-www-form-urlencoded",
                    "Access-Control-Allow-Origin" to "*"
            )

            val (_, response, _) = "https://almedalsguiden.com/main/search".httpPost().body(body).response()
            when (response.httpStatusCode) {
                204 -> {}
                401 -> throw Exception("bad permissions, 401 response code")
            }

            val factory = DocumentBuilderFactory.newInstance()

            factory.isNamespaceAware = true
            val builder = factory.newDocumentBuilder()
            val document = builder.parse(ByteArrayInputStream(response.data))
            println(document)
        }

    }
}

val body = "search=S%C3%B6k&" +
    "freetext=&" +
    "date_from=2017-07-02&" +
    "date_to=2017-07-09&" +
    "subject=&" +
    "event_form=&" +
    "eventType=&" +
    "organizer=&" +
    "orgtype=&" +
    "place=&" +
    "language=&" +
    "status=&" +
    "accessibility="