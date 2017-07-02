// @flow
import React from 'react'
import {
    Drawer, Card, CardHeader,
    IconButton,
} from 'material-ui'
import moment from 'moment'
import Favorites from "../services/favorites";
import Star from 'material-ui/svg-icons/toggle/star'

type EventItemProps = {
    item?: AlmedEvent,
    noTitle?: boolean,
}

export class EventItem extends React.Component {
    props: EventItemProps

    render() {
        const { item, noTitle } = this.props
        if (!item) {
            return <div />
        }

        const favs = Favorites.all()
        const favExists = favs.some(fav => fav.id === item.id)
        const latLng = `${item.latitude},${item.longitude}`
        return <div
            style={{ padding: '1em' }}
        >
            <IconButton
                onTouchTap={(e) => {
                    const exists = favs.some((fav) => fav.id === item.id)
                    if (exists) {
                        Favorites.delete(item)
                    } else {
                        Favorites.save(item)
                    }
                    this.forceUpdate()
                }}
                iconStyle={{ color: favExists ? '#eed383' : '#CCC' }}
            >
                <Star />
            </IconButton>
            {!noTitle && <h3>{item.title}</h3>}
            <p>{item.organiser}</p>
            <i>{moment(item.date).format('HH:mm dddd DD/MM')} - {moment(item.endDate).format('HH:mm')}</i>
            <p>{item.description}</p>

            <p>{item.location}</p>
            <p>{item.locationDescription}</p>
            <div>{(item.participants || []).map((part: AlmedParticipant) => <Card
                key={part.name}
                onClick={() => {
                    const q = `${part.name}+${part.title}+${part.company}`
                    const url = `https://www.google.se/search?q=${q}&oq=${q}`
                    console.log('goto', url)
                    {/*<a href={url}>Ask Google who it is!</a>*/}
                }}
            >
                <CardHeader
                    title={part.name}
                    subtitle={`${part.title || ''} - ${part.company || ''}`}
                />
            </Card>)}</div>
            <br />
            {item.food && <b>Serverar mat</b>}
            <p>Ämne: {item.subject}</p>
            <p>Typ: {item.type}</p>
            <br />
            <a href={item.web}>{item.web}</a>
            <br />
            <br />
            <a
                href={`https://www.google.com/maps/place/${latLng}/`}
            >
                <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?autoscale=1&size=600x300&maptype=roadmap&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:${item.locationDescription}%7C${latLng}`}
                    alt={`Google Map of ${latLng}`}
                /></a>
        </div>
    }
}

const ItemDrawer = (props: { item: ?AlmedEvent }) => <Drawer
    openSecondary={true}
    open={!!props.item}
>
    !!props.item && <EventItem item={props.item} />
</Drawer>

export default ItemDrawer