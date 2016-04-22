'use strict';

var util = require('util');
var fs = require('fs');
var phrasing = require('../data/phrasing');
var responses = require('../data/responses')
var Bot = require('slackbots');

var CHANNEL_NAME_REGEXP = new RegExp(/the-danger-zone/ig);
var CANT_WONT_REGEXP = new RegExp(/(i|we)\s(cant|can\'t)/gi);
const PHRASING_TRIGGER_POINT_VAL = 12;

var ArcherBot = function Constructor(settings) {
  this.settings = settings;
  this.settings.name = this.settings.name || '@archer';
  //this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'archerbot.db');

  this.user = null;
  //this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(ArcherBot, Bot);


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
    //if(this._isReplyFromJustJoinedUser(message)){
    //  this._replyWithDangerZoneResponse(message);
    //}
    if(this._isMentioningArcher(message)){
      this._replyWithRandomResponse(message);
    }
    else if(this._isTriggerCantWont(message)){
      this._replyWithCantOrWont(message);
    }
    else if(this._isTriggerPhrasingResponse(message)) {
      this._replyWithRandomPhrasing(message);
    }
  }
};

/**
 * On Channel Join, called when a channel_join subtype is detected for the channel archer is subscribed to
 * @param message
 * @returns {boolean}
 * @private
 */
//var joinedUser = '';
//ArcherBot.prototype._onChannelJoin = function (message) {
//  if(this._isChannelJoin(message) && this._isArcherHasChannel(message)){
//    this._replyWithDangerZoneDiatribe(message);
//  }
//};

ArcherBot.prototype._isTriggerPhrasingResponse = function (message) {
  return phrasing.phrasingScore(message.text) >= PHRASING_TRIGGER_POINT_VAL;
};

ArcherBot.prototype._replyWithRandomPhrasing = function (originalMessage) {
  var self = this;
  var response = pickRandom(responses.phrasing);
  var channel = self._getChannelById(originalMessage.channel);
  self.postMessageToChannel(channel.name, response, {as_user: true});
};

ArcherBot.prototype._isTriggerCantWont = function (message) {
  return CANT_WONT_REGEXP.test(message.text);
};

ArcherBot.prototype._replyWithCantOrWont = function (originalMessage) {
  var self = this;
  var channel = self._getChannelById(originalMessage.channel);
  self.postMessageToChannel(channel.name, 'Can\'t or won\'t?', {as_user: true});
};

ArcherBot.prototype._replyWithDangerZoneDiatribe = function (originalMessage) {
  var self = this;
  var name = message.user.profile.first_name || message.user.name;
  var channel = self._getChannelById(originalMessage.channel);
  var replyCount = 0; //TODO remove after implementing isReplyFromJustJoinedUser logic
  while(replyCount < 3) {
    setTimeout(function () {
      self.postMessageToChannel(channel.name, repeatName(name, replyCount), {as_user: true});
      replyCount++;
    }, 2000);
  }
};

function repeatName(name, replyCount){
  var response = name;
  switch(replyCount) {
    case 0:
      response = name.concat('.');
      break;
    case 1:
      response = name.concat('!');
      break;
    case 2:
      response = name.toUpperCase().concat('!');
      break;
    case 3:
      response = yellName(name);
      break;
    default:
      response = name;
  }
  return response;
}

function yellName(name) {
  var VOWEL_REGEXP = /(a|e|i|o|u|y)/ig;

  var lastVowelIndex;
  var vowel;
  for(var i = name.length-1; i > 0; i--){
    if(VOWEL_REGEXP.test(name.charAt(i))){
      lastVowelIndex = i;
      vowel = name.charAt(i);
      break;
    }
  }
  var nameBegin = name.slice(0, lastVowelIndex);
  var nameEnd = name.slice(lastVowelIndex, name.length);

  name = nameBegin + vowel.repeat(5) + nameEnd + '!';
  return name.toUpperCase();
}



/**
 * Replyes to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
ArcherBot.prototype._replyWithRandomResponse = function (originalMessage) {
  //var self = this;
  //self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
  //  if (err) {
  //    return console.error('DATABASE ERROR:', err);
  //  }
  //
  //  var channel = self._getChannelById(originalMessage.channel);
  //  self.postMessageToChannel(channel.name, record.joke, {as_user: true});
  //  self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
  //});
  var self = this;
  var channel = self._getChannelById(originalMessage.channel);
  self.postMessageToChannel(channel.name, pickRandom(responses.random), {as_user: true});
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
 * Util function to check if a given real time message object is because of a channel_join evtg
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isChannelJoin = function (message) {
  return message.subtype === 'channel_join' && CHANNEL_NAME_REGEXP.test(message.text);
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



//////////////////////////////// DB Implementation \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//var SQLite = require('sqlite3').verbose();
//var path = require('path');

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


module.exports = ArcherBot;