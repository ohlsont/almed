# Almedalsapp

The Almedal week is a yearly open political week based in Visby Gotland. This app is a desktop first app with 
the goal to provide a simpler and faster experience.

Feel free to contribute if there is some feature you would like.

The server is served by heroku, with all data stored in redis. 
The kotlin server is a experiment for running a java app on app engine.

# Instructions for both javascript platforms
Requirements: yarn 
## Installation
```
yarn
```

## Run
``` 
yarn dev
```

## Deploy (requires heroku stack locally)
``` 
./herokuDeploy.sh
```

## Remote logs
``` 
yarn herukoLogs
```