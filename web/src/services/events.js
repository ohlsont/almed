// @flow
import { backendUrl } from '../constants.js'

const eventsKey = 'items'
const dbVersionKey = 'dbVersion'
const currentVersion = '3'

export default class Events {
    static migrateDB() {
        const version: ?string = localStorage.getItem(dbVersionKey)
        if (version !== currentVersion) {
            localStorage.setItem(dbVersionKey, currentVersion)
            localStorage.setItem(eventsKey, '[]')
        }
    }

    static async fetchJson(method, url: string, body?: string): Promise<any> {
        const resp = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body,
        })

        switch (resp.status) {
            case 204:
                return {}
            case 401:
                throw new Error('bad permissions, 401 response code')
            default:
                break
        }

        if (!resp.ok) {
            console.log('response is not ok ', resp)
            throw new Error(`bad response from server ${resp.status}`)
        }

        return resp.json()
    }

    static async saveData(): Promise<Array<AlmedEvent>> {
        console.log('gettingItemsFromServer')
        const allData: Array<AlmedEvent> = await Events.fetchJson(
            'GET',
            backendUrl,
            // 'https://almed-171122.appspot.com/',
        )
        console.log('items gotten from server', allData)
        allData.forEach(ev => ev.date = (ev.date || '').replace('+00:00','+02:00'))
        allData.forEach(ev => ev.endDate = (ev.endDate || '').replace('+00:00','+02:00'))
        for(let i = 0;i<100;i++) {
            const s = allData.slice(i * 100,(i+1) * 100)
            console.log('debug ', s.length)
            localStorage.setItem(eventsKey + '-' + i, JSON.stringify(s))
        }

        return allData
    }

    static async updateData(): Promise<any> {
        fetch(`${backendUrl}/update`)
    }

    static getPersistentEvents(): Array<AlmedEvent> {
        let events: Array<AlmedEvent> = []
        for(let i = 0;i<100;i++) {
            const items = localStorage.getItem(eventsKey + '-' + i)
            if (!items || items === 'undefined') {
                console.warn('no events')
                return []
            }
            const evs: Array<AlmedEvent> = JSON.parse(items)
            events = events.concat(evs)
        }
        console.log('got events ', events.length)
        return events
    }

    static eventsForParticipant(participant: AlmedParticipant): Array<AlmedEvent> {
        const events = Events.getPersistentEvents()
        return events.filter(event => event.participants.some(part => part.name === participant.name))
    }
}