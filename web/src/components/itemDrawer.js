import React from 'react'
import { Drawer, Card, CardHeader } from 'material-ui'
import moment from 'moment'

export const EventItem = (props: { item?: AlmedEvent } ) => props.item ? <div
    style={{ padding: '1em' }}
>
    {/*<IconButton onClick={() => }><NavigationClose /></IconButton>*/}
    <h3>{props.item.title}</h3>
    <p>{props.item.organiser}</p>
    <i>{moment(props.item.date).format('HH:mm dddd DD/MM')} - {moment(props.item.endDate).format('HH:mm')}</i>
    <p>{props.item.description}</p>

    <p>{props.item.location}</p>
    <p>{props.item.locationDescription}</p>
    <div>{(props.item.participants || []).map((part: AlmedParticipant) => <Card key={part.name}>
        <CardHeader
            title={part.name}
            subtitle={`${part.title} - ${part.company}`}
        />
    </Card>)}</div>

    {props.item.food && <b>Serverar mat</b>}
    <p>Ämne: {props.item.subject}</p>
    <p>Typ: {props.item.type}</p>
    <a href={props.item.web}>{props.item.web}</a>
</div> : <div />

const ItemDrawer = (props: { item: ?AlmedEvent }) => <Drawer
    openSecondary={true}
    open={!!props.item}
>
    !!props.item && <EventItem item={props.item} />
</Drawer>

export default ItemDrawer