#!/usr/bin/env node

'use strict';

/**
 * ArcherBot launcher script.
 */

var ArcherBot = require('../src/archerBot');

/**
 * Environment variables used to configure the bot:
 *
 *  BOT_API_KEY : the authentication token to allow the bot to connect to your slack organization. You can get your
 *      token at the following url: https://<yourorganization>.slack.com/services/new/bot (Mandatory)
 *  BOT_DB_PATH: the path of the SQLite database used by the bot
 *  BOT_NAME: the username you want to give to the bot within your organisation.
 */
var token = process.env.BOT_API_KEY || require('../token');
//var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME || 'archer';

var archerbot = new ArcherBot({
  token: token,
  //dbPath: dbPath,
  name: name
});

archerbot.run();

var express = require('express');
var app     = express();

app.set('port', (process.env.PORT || 5000));

//For avoidong Heroku $PORT error
app.get('/', function(request, response) {
  var result = 'App is running'
  response.send(result);
}).listen(app.get('port'), function() {
  console.log('App is running, server is listening on port ', app.get('port'));
});