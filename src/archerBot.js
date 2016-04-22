# src / archerBot.js

'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');

var phrasing = require('../data/phrasing');
//var SQLite = require('sqlite3').verbose();

var Bot = require('slackbots');

var ArcherBot = function Constructor(settings) {
  this.settings = settings;
  this.settings.name = this.settings.name || '@archer';
  //this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'archerbot.db');

  this.user = null;
  //this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(ArcherBot, Bot);

const PHRASING_TRIGGER_POINT_VAL = 12;

/**
 * Run the bot
 * @public
 */
ArcherBot.prototype.run = function () {
  ArcherBot.super_.call(this, this.settings);

  this.on('start', this._onStart);
  this.on('message', this._onMessage);
};

/**
 * On Start callback, called when the bot connects to the Slack server and access the channel
 * @private
 */
ArcherBot.prototype._onStart = function () {
  this._loadBotUser();
  //this._connectDb();
  //this._firstRunCheck();
  this._welcomeMessage();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
ArcherBot.prototype._onMessage = function (message) {
  if (this._isChatMessage(message) && this._isChannelConversation(message) && !this._isFromArcherBot(message)) {

    this._triggerCantWont(message);

    if(this._isMentioningArcher(message)){
      this._replyWithRandomJoke(message);
    }
    else if(this._isTriggerPhrasingResponse(message)) {
      this._replyWithRandomPhrasing(message);
    }
  }
};

ArcherBot.prototype._isTriggerPhrasingResponse = function (message) {
  return phrasing.phrasingScore(message) >= PHRASING_TRIGGER_POINT_VAL;
};

ArcherBot.prototype._replyWithRandomPhrasing = function (originalMessage) {
  var self = this;
  var response = pickRandom(phrasing.responses);
  var channel = self._getChannelById(originalMessage.channel);
  self.postMessageToChannel(channel.name, response, {as_user: true});
};

ArcherBot.prototype._triggerCantWont = function (message) {
  var self = this;
  var pattern = new RegExp(/(i|we)\s(cant|can\'t)/gi);
  if(pattern.test(message)){
    var channel = self._getChannelById(originalMessage.channel);
    self.postMessageToChannel(channel.namae, 'Can\'t or won\'t?', {as user: true});
  }
};

/**
 * Replyes to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
ArcherBot.prototype._replyWithRandomJoke = function (originalMessage) {
  var self = this;
  self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
    if (err) {
      return console.error('DATABASE ERROR:', err);
    }

    var channel = self._getChannelById(originalMessage.channel);
    self.postMessageToChannel(channel.name, record.joke, {as_user: true});
    self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
  });
};

function pickRandom(list) {
  var idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

/**
 * Loads the user object representing the bot
 * @private
 */
ArcherBot.prototype._loadBotUser = function () {
  var self = this;
  this.user = this.users.filter(function (user) {
    return user.name === self.name;
  })[0];
};

/**
 * Open connection to the db
 * @private
 */
//ArcherBot.prototype._connectDb = function () {
//  if (!fs.existsSync(this.dbPath)) {
//    console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
//    process.exit(1);
//  }
//
//  this.db = new SQLite.Database(this.dbPath);
//};

/**
 * Check if the first time the bot is run. It's used to send a welcome message into the channel
 * @private
 */
//ArcherBot.prototype._firstRunCheck = function () {
//  var self = this;
//  self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
//    if (err) {
//      return console.error('DATABASE ERROR:', err);
//    }
//
//    var currentTime = (new Date()).toJSON();
//
//    // this is a first run
//    if (!record) {
//      self._welcomeMessage();
//      return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
//    }
//
//    // updates with new last running time
//    self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
//  });
//};

/**
 * Sends a welcome message in the channel
 * @private
 */
ArcherBot.prototype._welcomeMessage = function () {
  this.postMessageToChannel(this.channels[0].name, 'Was anyone looking for the worlds greatest secret agent?' +
    '\n If not, just say my name`' + this.name + '` and I\'ll be there... or not. Its not like I\'m your servant like Woodhouse',
    {as_user: true});
};

/**
 * Util function to check if a given real time message object represents a chat message
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isChatMessage = function (message) {
  return message.type === 'message' && Boolean(message.text);
};

/**
 * Util function to check if a given real time message object is directed to a channel
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isChannelConversation = function (message) {
  return typeof message.channel === 'string' &&
    message.channel[0] === 'C'
    ;
};

/**
 * Util function to check if a given real time message is mentioning Chuck Norris or the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isMentioningArcher = function (message) {
  return message.text.toLowerCase().indexOf('archer') > -1 ||
    message.text.toLowerCase().indexOf(this.name) > -1;
};

/**
 * Util function to check if a given real time message has ben sent by the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isFromArcherBot = function (message) {
  return message.user === this.user.id;
};

/**
 * Util function to get the name of a channel given its id
 * @param {string} channelId
 * @returns {Object}
 * @private
 */
ArcherBot.prototype._getChannelById = function (channelId) {
  return this.channels.filter(function (item) {
    return item.id === channelId;
  })[0];
};


module.exports = ArcherBot;