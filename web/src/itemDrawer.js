import React from 'react';
import { Drawer, Card, CardHeader, IconButton } from 'material-ui'
import NavigationClose from 'material-ui/svg-icons/navigation/close'
import moment from 'moment'

const ItemDrawer = (props: { item: ?AlmedEvent }) => <Drawer
    openSecondary={true}
    open={!!props.item}
>
    {!!props.item && <div>
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
    </div>}
</Drawer>

export default ItemDrawer