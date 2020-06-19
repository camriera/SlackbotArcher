# SlackbotArcher

![Archer Profile Pic](archer_head.png)

SlackbotArcher comes equipped with the famous DANGER ZONE diatribe triggered when someone joins a channel or group.
He also does phrasing, and "Can't or Won't?". Mention his name and see what he does!

![SlackbotArcher in action](slackbot-archer-in-action.png)

## Installation
Be sure to have npm and node installed, version `10.15.3` or later. 

```bash
$ npm install -g https://github.com/camriera/SlackbotArcher.git
```
Verify that the package installs properly. From your package root directory, enter the following to install your package globally.

```bash
$ npm install . -g
```

## Running the SlackbotArcher

To run SlackbotArcher you must have an [API token(#getting-the-api-token-for-your-slack-channel) to authenticate the bot on your slack channel.
Once you get it (instructions on the next paragraph) you just have to run:

```bash
BOT_API_KEY=secretapikey npm start
```

## Getting the API token for your Slack channel

To allow the SlackbotArcher to connect your Slack channel you must provide him an API key. To retrieve it you need to add a new Bot in your Slack organization by visiting the following url: https://*yourorganization*.slack.com/services/new/bot, where *yourorganization* must be substituted with the name of your organization (e.g. https://*yourorganization*.slack.com/services/new/bot). Ensure you are logged to your Slack organization in your browser and you have the admin rights to add a new bot.

You will find your API key under the field API Token, copy it in a safe place and get ready to use it.

## Configuration

The SlackbotArcher is configurable through environment variables. There are several variable available:

| Environment variable | Description |
|----------------------|-------------|
| `BOT_API_KEY` | this variable is mandatory and must be used to specify the API token needed by the bot to connect to your Slack organization |
| `BOT_NAME` | the name of your bot, it’s optional and it will default to archer |
| `BOT_DB_PATH` | the path to your DB that hosts responses, etc |


## Launching the bot from source

If you downloaded the source code of the bot you can run it using NPM with:

```bash
$ npm start
```

Don't forget to set your `BOT_API_KEY` environment variable bedore doing so. Alternatively you can also create a file called `token.js` in the root folder and put your token there (you can use the `token.js.example` file as a reference).

## Heroku Cloud Hosting

Optional cloud service provider that has free tier hosting for your bot. Click the link below and create an account, set your BOT_API_TOKEN and you are good to go!

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Note: After scaling up your app, you may need to switch the DYNO to a `worker` instance, instead of `web` (default) as the app may crash if it never binds to a port (which you don't need). If you find the app crashing after 60 seconds, you can run these commands:

```bash
$ heroku ps:scale web=0
$ heroku ps:scale worker=1
```

This scales down the default DYNO (web) and spins up a worker DYNO instance which does not require any port bindings.

Additionally, if you don't commit your API Token (Which you should definitely Git ignore) you can configure the environment variable for Heroku with:
```bash
$ heroku config:set BOT_API_KEY=[your-key-here]
```