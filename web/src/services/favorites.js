// @flow

const favKeys = 'favKeys'

const getFavs = () => {
    const jsonString = localStorage.getItem(favKeys)
    if (!jsonString) {
        console.log('no data')
        return []
    }
    const favs: Array<AlmedEvent> = JSON.parse(jsonString)
    return favs
}
const saveFavs = (favs: Array<AlmedEvent>) => localStorage.setItem(favKeys, JSON.stringify(favs))

export default class Favorites {
    static all = getFavs

    static save(event: AlmedEvent) {
        const favs = getFavs()
        favs.push(event)
        saveFavs(favs)
    }

    static delete(event: AlmedEvent) {
        saveFavs(getFavs().filter((fav) => fav.id !== event.id))
    }
}