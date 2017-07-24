import com.google.appengine.repackaged.com.google.gson.Gson
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class HelloTest {
    @Test fun testAssert() : Unit {
        val ids = Almed.getIds()
        assertTrue(ids.count() > 0)
    }

    @Test fun testItem() : Unit {
        val mapPoints = Almed.getMapPoints()?.map { it.id to it }?.toMap()
        assertNotNull(mapPoints)
        if (mapPoints == null) return
        val item: AlmedEvent? = Almed.getItem("item/6862", mapPoints)
        val storedItem: AlmedEvent = Gson().fromJson<AlmedEvent>(jsonItem)

        assertEquals(storedItem.id, item?.id)
        assertEquals(storedItem.title, item?.title)
        assertEquals(storedItem.organiser, item?.organiser)
        assertEquals(storedItem.date, item?.date)
        assertEquals(storedItem.endDate, item?.endDate)
        assertEquals(storedItem.type, item?.type)
        assertEquals(storedItem.subject, item?.subject)
        assertEquals(storedItem.language, item?.language)
        assertEquals(storedItem.location, item?.location)
        assertEquals(storedItem.locationDescription, item?.locationDescription)
        assertEquals(storedItem.description, item?.description)
//        assertEquals(item?.latitude, storedItem.latitude)
//        assertEquals(item?.longitude, storedItem.longitude)
        assertEquals(storedItem.participants.count(), item?.participants?.count() ?: 0, "${item?.participants?.map { it.name }}")
        for(i in 0..(item?.participants?.count() ?: 1)) {
            val p = item?.participants?.getOrNull(i)?.let { it } ?: break
            val storedP = storedItem?.participants[i]
            assertEquals(storedP.name, p.name)
//            assertEquals(storedP.title, p.title)
//            assertEquals(storedP.company, p.company)
        }
        assertEquals(storedItem.green, item?.green)
//        assertEquals(storedItem.availabilty, item?.availabilty)
        assertEquals(storedItem.live, item?.live)
        assertEquals(storedItem.food, item?.food)
        for(i in 0..(item?.web?.count() ?: 1)) {
            assertEquals(storedItem.web?.getOrNull(i) ?: "", item?.web?.getOrNull(i) ?: "")
        }

        assertEquals(storedItem.url, item?.url)
        for(i in 0..(item?.parties?.count() ?: 1)) {
            assertEquals(storedItem.parties?.getOrNull(i), item?.parties?.getOrNull(i))
        }

    }
}

val jsonItem = """
    {
        "id":"6862",
        "title":"Vattenkrig – kriget om vatten. Samverkan för hållbara innovationer i kris och katastrof",
        "organiser":"Läkarmissionen",
        "date":"2017-07-04T11:00:00+02:00",
        "endDate":"2017-07-04T11:45:00+02:00",
        "type":"Seminarium",
        "subject":["Hållbarhet","Internationella frågor"],
        "language":"Svenska",
        "location":"Donners plats, H400_a",
        "locationDescription":"Sidas paviljong - Sverige i Världen",
        "description":"Hur kan vi i Sverige i partnerskap tillsammans med företag, myndigheter, universitet, biståndsorganisationer och institutioner få fram hållbara innovationer i internationella kris och katastrofdrabbade områden?",
        "latitude":null,
        "longitude":null,
        "participants":[
            {"name":"Lena Ingelstam","title":"Chef för avd. Innovation och Partnerskap","company":"Sida"},
            {"name":"Anders Jägerskog","title":"Senior Water Resources Mgmt Specialist","company":"World Bank"},
            {"name":"Thomas Palo","title":"Teknisk rådgivare","company":"Internationella avd"},
            {"name":"Andreas Zetterlund","title":"Head of Marketing & Fundraising Department","company":"Internationell Aid Service"},
            {"name":"Charlotta Möller","title":"Sektionschef Hållbart Samhälle","company":"RISE"},
            {"name":"Anders Wollter","title":"Ministerråd","company":"Enheten för främjande och hållbart företagande"},
            {"name":"Tove Engström","title":"PL Samverkansplattformen","company":"Läkarmissionen"}],
        "green":false,
        "availabilty":"Teleslinga finns, Entré och lokal tillgänglig för rullstol\n",
        "live":false,
        "food":false,
        "web":["http://www.sverigeivarlden.se."],
        "url":"https://almedalsguiden.com/event/6862",
        "parties":[]}
        """