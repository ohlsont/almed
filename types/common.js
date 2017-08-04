type AlmedParticipant = {
    name: string,
    title: string,
    company: string,
}

type AlmedEvent = {
    id: string,
    title: string,
    organiser: string,
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
    parties: Array<string>,
    green: boolean,
    availabilty: string,
    live: boolean,
    food: boolean,
    web: Array<string>,
    url: string,
}

type FacebookProfile = {
    id: string,
    first_name: string,
    last_name: string,
    name: string,
    email: string,
    locale: string,
    gender: string,
    timezone: number,
    verified: boolean,
    link: string,
}

type FacebookLoginData = {
    profile: FacebookProfile,
    tokenDetail: {
        accessToken: string,
        userID: string,
        expiresIn: number,
        signedRequest: string,
    },
}