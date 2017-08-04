// @flow
import { Router } from 'express'

import { userRoutes } from './user'
import { seminarRoutes } from './almed'

const routes: any = Router()
userRoutes(routes)
seminarRoutes(routes)

export default routes
