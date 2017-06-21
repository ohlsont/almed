// @flow
import app from './app'

const { PORT = 8080 } = process.env
// $FlowFixMe
app.listen(PORT, () => console.log(`Listening on port ${PORT}`)) // eslint-disable-line no-console
