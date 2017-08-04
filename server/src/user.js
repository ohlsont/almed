// @flow
import passport from 'passport'
import FacebookTokenStrategy from 'passport-facebook-token'

import { get, add } from './storage'

const userDataKey = (id: string) => `fbuser-${id}`
const favsKey = (id: string) => `fbuser-${id}-favs`

class User {
  static async findById(fbProfileId: string): Promise<FacebookProfile> {
    return get(userDataKey(fbProfileId))
  }

  static async add(facebookUser: FacebookProfile) {
    const user = await User.findById(facebookUser.id)
    if (!user) {
      return
    }
    add(userDataKey(facebookUser.id), facebookUser)
  }

  static async getUserFavorites(fbProfileId: string): Promise<FacebookProfile> {
    return get(favsKey(fbProfileId))
  }

  static async updateUserFavorites(fbProfileId: string, favs: Array<AlmedEvent>) {
    const key = userDataKey(fbProfileId)
    const existingFavs = (await get(key)) || []
    add(userDataKey(fbProfileId), existingFavs.concat(favs))
  }
}

export const userRoutes = (routes: any) => {
  passport.use(new FacebookTokenStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    },
    (accessToken, refreshToken, profile, cb) => {
      // In this example, the user's Facebook profile is supplied as the user
      // record.  In a production-quality application, the Facebook profile should
      // be associated with a user record in the application's database, which
      // allows for account linking and authentication with other identity
      // providers.
      console.log('debug', profile)
      return cb(null, profile)
    }))

  routes.get('/auth/facebook/token',
    passport.authenticate('facebook-token'),
    async (req, res) => {
      // do something with req.user
      console.log('add /auth/facebook/token', res)
      const favs = await User.getUserFavorites(req.user.id)
      res.json(favs || [])
    }
  )

  passport.serializeUser((user: FacebookProfile, done: (err: ?Error, res: any)=>void) => {
    done(null, user.id)
  })

  passport.deserializeUser(async (id: string, done: (err: ?Error, res: any)=>void) => {
    done(null, await User.findById(id))
  })

  routes.get('/favorites',
    passport.authenticate('facebook-token'),
    async (req) => {
      const user = req.user
      return await User.getUserFavorites(user.id)
    })
}

export default User
