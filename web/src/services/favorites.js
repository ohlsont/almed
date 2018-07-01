// @flow
import { backendUrl } from '../constants'
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

const getFBToken = (): string => {
    const token = localStorage.getItem(Favorites.fbToken)
    if (!token) {
        throw new Error('no token')
    }
    return token
}

function dedupeByKey(arr, key) {
    const temp = arr.map(el => el[key]);
    return arr.filter((el, i) =>
        temp.indexOf(el[key]) === i
    );
}

const saveFavs = (favs: Array<AlmedEvent>) => localStorage.setItem(favKeys, JSON.stringify(favs))

export default class Favorites {
    static fbToken = 'fbTokenKey'
    static all = getFavs

    static save(event: AlmedEvent) {
        const favs = getFavs()
        favs.push(event)
        saveFavs(favs)
        Favorites.saveFavoritesRemote(false)
    }

    static delete(event: AlmedEvent) {
        saveFavs(getFavs().filter((fav) => fav.id !== event.id))
        Favorites.saveFavoritesRemote(false)
    }

    // returns favorites
    static async auth(fbToken: string): Promise<Array<AlmedEvent>> {
        const token = fbToken
        const url = `${backendUrl}/auth/facebook/token?access_token=${token}`
        const fbResponse = await fetch(url)
        const j: Array<AlmedEvent> = await fbResponse.json()
        console.log('fbResponse', j)
        return Favorites.saveFavoritesRemote(true)
    }

    static async saveFavoritesRemote(merged: boolean): Promise<Array<AlmedEvent>> {
        const token = getFBToken()
        const url = `${backendUrl}/favorites?access_token=${token}`
        const favorites = merged ? await Favorites.getRemoteFavoritesMerged() : await Favorites.getRemoteFavorites()
        console.log('sending favs: ', favorites)
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(favorites),
        })

        const j = await res.json()
        console.log('json saveFavoritesRemote', j)

        return favorites
    }

    static async getRemoteFavorites(): Promise<Array<AlmedEvent>> {
        const token = getFBToken()
        const url = `${backendUrl}/favorites?access_token=${token}`
        const resp = await fetch(url)
        const seminars: Array<AlmedEvent> = await resp.json() || []
        return seminars
    }

    static async getRemoteFavoritesMerged(): Promise<Array<AlmedEvent>> {
        const localSems = getFavs()
        const seminars = await Favorites.getRemoteFavorites()
        if (!seminars.length) {
            throw new Error(`bad resp from server ${JSON.stringify(seminars)}`)
        }
        const mergedFavs = dedupeByKey((seminars || []).concat(localSems), 'id')
        saveFavs(mergedFavs)
        return mergedFavs
    }
}