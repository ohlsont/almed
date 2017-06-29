type AlmedParticipant = {
    name: string,
    title: string,
    company: string,
}

type AlmedEvent = {
    id: string,
    title: string,
    organiser?: ?string,
    date: ?string,
    endDate: ?string,
    type: string,
    subject: Array<string>,
    language: string,
    location: string,
    locationDescription: string,
    description: string,
    latitude: number,
    longitude: number,
    participants: Array<AlmedParticipant>,
    green: boolean,
    availabilty: string,
    live: boolean,
    food: boolean,
    web: Array<string>,
    url: string,
}