Deployment
==========

This is a small walkthrough on publishing your app in some popular PaaS providers.

### Heroku

Log in to [Heroku](https://heroku.com) or create a new account if you don't have one.

Then you'll need to install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) on your machine. The previous link has detailed instructions.

Create a new app from the dropdown "New" on the top right of Heroku's dashboard screen. Give your app a name and select its servers' location.

Heroku uses [Yarn](https://yarnpkg.com) to install and run npm scripts by default (if it detects a `yarn.lock` file). Unfortunately Yarn has an [outstanding issue](https://github.com/yarnpkg/yarn/issues/761) that makes it hard to build production using it, so we'll need to use `npm` instead.

Create a `.slugignore` file at the root of your repo and add `yarn.lock`:

```sh
touch .slugignore
echo 'yarn.lock' >> .slugignore
```

Then check the file into git. This will instruct Heroku to use `npm` for all builds and commands ([relevant documentation](https://devcenter.heroku.com/articles/nodejs-support#build-behavior)).

On the "Deploy" tab of your new app, under "Deploy using Heroku Git", you will find all the instructions you need:

Log in to your Heroku account via the Heroku CLI:

```sh
heroku login
```

Initialize your git repository with Heroku:

```sh
heroku git:remote -a your-apps-name
```

Deploy your application:

```sh
git push heroku master
```

And you're done! Your app should be running at `https://your-apps-name.herokuapp.com/`.

Relevant documentation on Heroku: [https://devcenter.heroku.com/articles/getting-started-with-nodejs](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
