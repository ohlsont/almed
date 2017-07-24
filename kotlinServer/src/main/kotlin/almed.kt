import com.github.kittinunf.fuel.core.FuelManager
import com.github.kittinunf.fuel.httpGet
import com.github.kittinunf.fuel.httpPost
import org.joda.time.DateTime
import org.joda.time.format.DateTimeFormat
import org.joda.time.format.ISODateTimeFormat
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.jsoup.nodes.Element
import java.text.SimpleDateFormat
import java.util.*


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

val alphabetRegexp = """/[a-z\wåäöÅÄÖ]/i""".toRegex()
val rfc3339 = DateTimeFormat.forPattern("yyyy-MM-dd'T'HH:mm:ssZZ")
var dtf = DateTimeFormat.forPattern("dd/MM YYYY, HH:mm")

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
        fun getIds(): Array<String> {
            FuelManager.instance.baseHeaders = mapOf(
                    "Content-Type" to "application/x-www-form-urlencoded",
                    "Access-Control-Allow-Origin" to "*"
            )

            val (_, response, result) = "https://almedalsguiden.com/main/search".httpPost().body(body).responseString()
            when (response.httpStatusCode) {
                204 -> {}
                401 -> throw Exception("bad permissions, 401 response code")
            }

            val unwrappedString: String = result.component1()?.let { it } ?: return arrayOf()
            val doc = Jsoup.parse(unwrappedString)

            val callback: (tree2: Element) -> Boolean = {
                val id = it.attr("id")
                id == "search_result"
            }
            val mainElement = traverseTree(doc.body(), callback)?.children()?.get(1)
            val unWrappedMainElement = mainElement?.let { it } ?: {
                throw Exception("no main elem")
            }()
            return unWrappedMainElement.children().map {
                println(it.attributes().map { it.html() })
                it.attr("href")
            }.toTypedArray()
        }

        fun getMapPoints(): Array<MapPoint>? {
            FuelManager.instance.baseHeaders = mapOf(
                    "Content-Type" to "application/x-www-form-urlencoded",
                    "Access-Control-Allow-Origin" to "*"
            )

            val (_, response, result) = "https://almedalsguiden.com/api?version=js".httpPost().body("search_place=a").responseObject(MapPoints.Deserializer())
            when (response.httpStatusCode) {
                204 -> {}
                401 -> throw Exception("bad permissions, 401 response code")
            }
            return result.component1()?.result
        }

        fun getParsedItem(id: String): Element? {
            val (_, response, result) = "https://almedalsguiden.com/event/$id".httpGet().responseString()
            val unwrappedString: String = result.component1()?.let { it } ?: return null
            // (tree2) => !!tree2.attributes && tree2.attributes.id === 'event'
            return Jsoup.parse(unwrappedString).body()
        }

        fun applyChildren(elem: Element?, arr: Array<Int>, withContent: Boolean = true): String? {
            val res: String? = arr.fold(elem, { acc, i -> acc?.children()?.getOrNull(i) })?.html()?.split("</strong>")?.last()
            val r: String = res?.let { it } ?: return null
            if (withContent) {
                return removeFirstSpace(r)
            } else {
                return r
            }
        }

        fun removeFirstSpace(str: String): String {
            val b = str.getOrNull(0)?.isLetter()
            if (b != null && !b) {
                return str.removeRange(0, 1)
            } else {
                return str
            }
        }

        fun getItem(href: String, mapPoints: Map<String, MapPoint>): AlmedEvent? {
            val id = href.split("/").last()
            val mapPoint = mapPoints[id]
            val elem: Element = getParsedItem(id)?.let { it } ?: return null

            var article = traverseTree(elem, { tree2 -> tree2.attr("id") == "event" })
            if (article == null || article?.children().isEmpty()) {
                article = traverseTree(elem, { tree2 -> tree2.classNames().contains("main-content") })?.let { it } ?: return null
                if (article?.children().isEmpty()) {
                    throw Exception("found no main content")
                }
            }

            val article2: Element = article
            val filterFuncChildren: (filterFor: String) -> Element? = { filterFor ->
                val item = traverseTree(article2, {
                    val child: String? = applyChildren(it, arrayOf(0))
                    println("comparing $child === $filterFor = ${child == filterFor} $it")
                    child == filterFor
                })
                if (item == null) println("could not find $filterFor")
                item
            }

            val filterFunc: (filterFor: String) -> String? = filterFunc@ { filterFor ->
                println(filterFor)
                val item: Element? = filterFuncChildren(filterFor)
                if(item == null || item.children().get(0) == null) {
                    return@filterFunc null
                }

                val r: String = item?.html()?.split("</strong>")?.last() ?: return@filterFunc null
                println("rrrr ${removeFirstSpace(r)} $item ${item?.html()}")
                return@filterFunc removeFirstSpace(r)
            }

            val p = filterFuncChildren("Medverkande:")
            var participants: Array<AlmedParticipant> = arrayOf()

//            val a2 = p?.filter { item -> if (item.html() != null) item.html().matches(alphabetRegexp) else false  }
            val a2 = p?.html()?.split("</strong>")?.last()?.split("<br>")
            println("aa222 ${a2}")
            participants = a2?.map {
                val pList = it.split(",").map{removeFirstSpace(it)}
                AlmedParticipant(
                        name = pList.getOrNull(0) ?: "",
                        title = pList.getOrNull(1) ?: "",
                        company = pList.getOrNull(2) ?: ""
                )
            }?.filter { it.name != "" }?.toTypedArray() ?: arrayOf()

            val dd = filterFunc("Dag:")
            var endDate: DateTime? = null
            var date: DateTime? = null
            if (dd != null) {
                val dateEndDateList = dd.split("–")
                val dateString = dateEndDateList.getOrNull(0)
                println("dd ${dateEndDateList[1]}")
                if (dateString != null) {
                    date = dtf.parseDateTime(dateString)
                    if (date != null && dateEndDateList.count() > 1) {
                        endDate = dtf.parseDateTime(dateString)

                        val endTimeList = dateEndDateList[1].split(':')
                        if (endDate != null && endTimeList.count() > 1) {
                            endDate = endDate.withHourOfDay(Integer.parseInt(endTimeList[0]))
                            endDate = endDate.withMinuteOfHour(Integer.parseInt(endTimeList[1]))

                        }
                    }
                }
            }

            val web: String? = traverseTree(article, { child: Element ->
                val href = child.attr("href")
                href != null && href != ""
            })?.attr("href")
            val desc = applyChildren(article2, arrayOf(3)) ?: ""
            return AlmedEvent(
                    id = id,
                    title = article.attr("titel"),
                    organiser = filterFunc("Arrangör:") ?: "",
                    date = if (date != null) rfc3339.print(date) else null ,
                    endDate = if (endDate != null) rfc3339.print(endDate) else null ,
                    type = filterFunc("Typ:") ?: "",
                    subject = listOf(filterFunc("Ämnesområde:"), filterFunc("Ämnesområde 2:")).filterNotNull(),
                    language = filterFunc("Språk:") ?: "",
                    location = filterFunc("Plats:") ?: "",
                    locationDescription = filterFunc("Platsbeskrivning:") ?: "",
                    description = desc,
                    latitude = mapPoint?.LATITUDE?.toDouble() ?: .0,
                    longitude = mapPoint?.LONGITUDE?.toDouble() ?: .0,
                    participants = participants,
                    green = filterFunc("Grönt evenemang:")?.contains("/Ja/") ?: false,
                    live = filterFunc("Direktsänds på internet:")?.contains("/Ja/") ?: false,
                    food = filterFunc("Förtäring:")?.contains("/Ja/") ?: false,
                    availabilty = filterFunc("Tillgänglighet:") ?: "",
                    web = arrayOf(web).filterNotNull().toTypedArray(),
                    url = "https://almedalsguiden.com/event/${id}",
                    parties = partiesFromParticipants(participants)
            )
//            const eventResult: AlmedEvent = {
//                id,
//                title: (article.attributes || {}).titel,
//                organiser,
//                date: date ? date.format() : null,
//                endDate: endDate ? endDate.format() : null,
//                type: filterFunc('Typ:') || '',
//                subject: [filterFunc('Ämnesområde:'), filterFunc('Ämnesområde 2:')].filter(Boolean),
//                language: filterFunc('Språk:') || '',
//                location: filterFunc('Plats:') || '',
//                locationDescription: filterFunc('Platsbeskrivning:') || '',
//                description: applyChildren(itemContent, [7,0]),
//                latitude: parseFloat(mapPoint.LATITUDE),
//                longitude: parseFloat(mapPoint.LONGITUDE),
//                participants,
//                green: !!(green && green.includes('Ja')),
//                availabilty: filterFunc('Tillgänglighet:') || '',
//                live: !!(live && live.includes('Ja')),
//                food: !!(food && food.includes('Ja')),
//                web: [((traverseTree(itemContent, (child) => !!((child || {}).attributes || {}).href) || {}).attributes || {}).href]
//                .filter(Boolean),
//                url: `https://almedalsguiden.com/event/${id}`,
//                parties: partiesFromParticipants(participants)
//                // contact: applyChildren(itemContent, [15,1,1,0,0]),
//                // contactOrg: applyChildren(itemContent, [15,1,1]),
//                // contactNumber: applyChildren(itemContent, [6,1,1]),
//            }
        }

        fun getEvents(): Array<AlmedEvent> {
            val ids = getIds()
            val mapPoints = getMapPoints()
            val mapPointsMap = mapPoints?.map { it.id to it }?.toMap()

            if (mapPointsMap == null) return arrayOf()
            var events = arrayOf<AlmedEvent>()

            val idsChunks: List<List<String>> = ids.batch(100)
            for (idsChunk in idsChunks) {
                val items = idsChunk.map { getItem(it, mapPointsMap) }.filterNotNull().toTypedArray()
                Thread.sleep(1_000)
                events = events + items
            }
            return events
        }
    }
}

/*
* export const partiesFromParticipants = (parts: AlmedParticipant[]): Array<string> => {
  const partsParties: Array<string> = parts.map((part) => {
    const f = (substrings: Array<string>, ret): ?string => [part.company, part.title]
      .some((str) => substrings
        .some((substr) => str
          .search(substr) > -1)) ? ret : null
    const partiesStr = [
      f(['\\(s\\)', 'socialdemokraterna'], 's'),
      f(['\\(m\\)', 'moderaterna'], 'm'),
      f(['\\(l\\)', 'liberalerna'], 'l'),
      f(['\\(c\\)', 'centerpartiet'], 'c'),
      f(['\\(v\\)', 'vänsterpartiet'], 'v'),
      f(['\\(sd\\)', 'sverigedemokraterna'], 'sd'),
      f(['\\(mp\\)', 'miljöpartiet'], 'mp'),
    ].filter(Boolean)
    return partiesStr
  }).reduce((acc, strs: Array<string>) => {
    return acc.concat(strs)
  }, [])
  return [...new Set(partsParties)]
}*/

fun partiesFromParticipants(parts: Array<AlmedParticipant>): Array<String> {
    val partsParties: Array<Array<String>> = parts.map { part ->
        val f: (substrings: Array<String>, ret: String) -> String? = { substrings, ret ->
            if (arrayOf(part.company, part.title)
                    .filter{ str: String -> substrings
                            .filter { substr: String -> str.contains("/${substr}/") }.isNotEmpty() }.isNotEmpty())
                ret else null
        }
        val partiesStr: Array<String> = arrayOf(
                f(arrayOf("\\(s\\)", "socialdemokraterna"), "s"),
                f(arrayOf("\\(m\\)", "moderaterna"), "m"),
                f(arrayOf("\\(l\\)", "liberalerna"), "l"),
                f(arrayOf("\\(c\\)", "centerpartiet"), "c"),
                f(arrayOf("\\(v\\)", "vänsterpartiet"), "v"),
                f(arrayOf("\\(sd\\)", "sverigedemokraterna"), "sd"),
                f(arrayOf("\\(mp\\)", "miljöpartiet"), "mp")
        ).filterNotNull().toTypedArray()
        partiesStr
    }.toTypedArray()
    return partsParties.fold(arrayOf<String>(), { acc, strs: Array<String> -> acc.plus(strs) }).distinct().toTypedArray()
}

fun traverseTree(tree: Element, callback: (tree2: Element) -> Boolean): Element? {
    if (callback(tree)) {
        return tree
    }
    var res: Element? = null
    for (child in tree.children()) {
        res = traverseTree(child, callback)
        if (res != null) {
            break
        }
    }
    return res
}

/*
export const traverseTree = (
  tree: HTMLTreeChild,
  func: (tree2: HTMLTreeChild)=>boolean
): ?HTMLTreeChild => {
  if (func(tree)) {
    return tree
  }
  let res
  const producedResult = (tree.children || []).some(child => {
    res = traverseTree(child, func)
    return !!res
  })
  return res
}
* */

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

fun <T> Array<T>.batch(chunkSize: Int) =
        mapIndexed { i, item -> i to item }. // create index value pairs
                groupBy { it.first / chunkSize }.    // create grouping index
                map { it.value.map { it.second } }   // split into different partitions