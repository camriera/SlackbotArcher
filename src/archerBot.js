'use strict';

var util = require('util');
var fs = require('fs');
var phrasing = require('../data/phrasing');
var responses = require('../data/responses')
var Bot = require('slackbots');

const PHRASING_TRIGGER_POINT_VAL = 10;
var CANT_WONT_REGEXP = (/(i|we)\s(cant|can\'t)/ig);
var JOIN_RESPONSE = (/wh*?a+t|yes|yeah?|shut.*up|wu+t|no/ig);
var VOWEL_REGEXP = /a|e|i|o|u|y/ig;

var newUser = {
  id: '',
  joined: false,
  responded: false
};

var ArcherBot = function Constructor(settings) {
  this.settings = settings;
  this.settings.name = this.settings.name || 'archer';
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
  console.log('archer bot: ' + this.user);
  this._welcomeMessage();

  //this._connectDb();
  //this._firstRunCheck();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
ArcherBot.prototype._onMessage = function (message) {
  if (this._isChatMessage(message) && this._isChannelOrGroupConversation(message) && !this._isFromArcherBot(message)) {
    console.log(message);
    if (this._isReplyFromJustJoinedUser(message)) {
      if (JOIN_RESPONSE.test(message.text)) {
        this._postMessage(message, pickRandom(responses.dangerZone));
        newUser.joined = false;
        newUser.responded = true;
        newUser.id = '';
      }
    }
    else if (this._isMentioningArcher(message)) {
      this._postMessage(message, pickRandom(responses.random));
    }
    else if (this._isTriggerCantWont(message)) {
      this._postMessage(message, responses.cantWont);
    }
    else if (this._isTriggerPhrasingResponse(message)) {
      this._postMessage(message, pickRandom(responses.phrasing));
    }
    //User joins channel or group
    else if (this._isChannelJoin(message) || this._isGroupJoin(message)) {
      console.log('user '+message.user+ ' joined channel/group' + message.channel);
      newUser.joined = true;
      newUser.id = message.user;
      newUser.responded = false;
      this._replyWithDangerZoneDiatribe(message);
    }
  }
};

/**
 * Checks whether the message text contains enough innuendo to trigger a 'PHRASING' response
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isTriggerPhrasingResponse = function (message) {
  return phrasing.phrasingScore(message.text) >= PHRASING_TRIGGER_POINT_VAL;
};

/**
 * Checks whether the message text contains value for appropriate 'Cant or wont?' response
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isTriggerCantWont = function (message) {
  return CANT_WONT_REGEXP.test(message.text);
};

/**
 * Checks whether the newest joined user replied to the group/channel for use in danger zone diatribe
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isReplyFromJustJoinedUser = function (message) {
  return message.user === newUser.id;
};

/**
 * Replies with the danger zone Lana like diatribe using the users name who just joined the channel/group
 * @param originalMessage
 * @private
 */
ArcherBot.prototype._replyWithDangerZoneDiatribe = function (originalMessage, replyCount) {
  var self = this;
  var user = self._getUserById(originalMessage.user);
  var name = user.profile.first_name || user.name;
  replyCount = replyCount || 0;
  if(replyCount > 3 || newUser.responded){
    return;
  }
  var increment = replyCount + 1;
  setTimeout(function () {
    self._postMessage(originalMessage, repeatName(name, replyCount), self._replyWithDangerZoneDiatribe(originalMessage, increment));
  }, 2000);
};

/**
 * Loads the user object representing the bot
 * @private
 */
ArcherBot.prototype._loadBotUser = function () {
  var self = this;
  this.user = this.users.filter(function (user) {
    return user.name === self.name;
  })[0];
  console.log('Bot details: '+this.user);
};

/**
 * Sends a welcome message in the channel
 * @private
 */
ArcherBot.prototype._welcomeMessage = function () {
  if(this.channels.length){
    this._postMessage({type: 'message', channel: this.channels[0].name}, responses.welcome);
  }
  if(this.groups.length){
    this._postMessage({type: 'message', channel: this.groups[0].name}, responses.welcome);
  }
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
    message.channel[0] === 'C';
};

/**
 * Util function to check if a given real time message object is directed to a group
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isGroupConversation = function (message) {
  return typeof message.channel === 'string' && message.channel[0] === 'G';
};

/**
 * Util function to check if a given real time message object is directed to a group
 * @param message
 * @returns {boolean}
 */
ArcherBot.prototype._isChannelOrGroupConversation = function (message) {
  return typeof message.channel === 'string' && this._isChannelConversation(message) ||
      this._isGroupConversation(message);
};

/**
 * Util function to post message either to channel or group
 * @param originalMessage
 * @param response
 * @private
 */
ArcherBot.prototype._postMessage = function (originalMessage, response, callback) {
  //console.log('posting message to ' +originalMessage.channel + ' - ' + response);
  if(this._isChannelConversation(originalMessage)){
    var channel = this._getChannelById(originalMessage.channel);
    this.postMessageToChannel(channel.name, response, {as_user: true});
  }
  if(this._isGroupConversation(originalMessage)){
    var group = this._getGroupById(originalMessage.channel);
    this.postMessageToGroup(group.name, response, {as_user: true}, callback);
  }
};

/**
 * Util function to check if a given real time message object is because of a channel_join event
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isChannelJoin = function (message) {
  var isJoinedBotChannel = false;
  if(message.subtype === 'channel_join') {
    this.channels.forEach(function (channel) {
      if (message.channel === channel.id){
        isJoinedBotChannel = true;
      }
    });
  }
  return isJoinedBotChannel;
};

/**
 * Util function to check if a group_join
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isGroupJoin = function (message) {
  var isJoinedBotGroup = false;
  if(message.subtype === 'group_join') {
    this.groups.forEach(function (group) {
      if(group.id === message.channel){
        isJoinedBotGroup = true;
      }
    });
  }
  return isJoinedBotGroup;
};

/**
 * Util function to check if a given real time message is mentioning Chuck Norris or the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isMentioningArcher = function (message) {
  return message.text.indexOf(this.user.id) > -1 ||
    message.text.toLowerCase().indexOf('archer') > -1 ||
    message.text.toLowerCase().indexOf('sterling') > -1 ||
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

/**
 * Util function to get the group by its id
 * @param groupId
 * @returns {T|*}
 * @private
 */
ArcherBot.prototype._getGroupById = function (groupId) {
  return this.groups.filter(function (item) {
    return item.id === groupId;
  })[0];
};


/**
 * Util function to get the user by its id
 * @param userId
 * @returns {T|*}
 * @private
 */
ArcherBot.prototype._getUserById = function (userId){
  return this.users.filter(function (user) {
    return user.id === userId;
  })[0];
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
  console.log('replying with users name: ' + response);
  return response;
}

function pickRandom(list) {
  var idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

function yellName(name) {
  if(!name || name.length < 2){
    return;
  }
  var lastVowelIndex, vowelToExpand;
  for(var i = name.length-1; i > 0; i--){
    if(VOWEL_REGEXP.test(name.charAt(i))){
      lastVowelIndex = i;
      vowelToExpand = name.charAt(i);
      break;
    }
  }
  var nameBegin = name.slice(0, lastVowelIndex);
  var nameEnd = name.slice(lastVowelIndex, name.length);

  name = nameBegin + vowelToExpand.repeat(5) + nameEnd + '!';
  return name.toUpperCase();
}

//////////////////////////////// DB Implementation \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

/**
 * Replyes to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
//ArcherBot.prototype._replyWithRandomResponse = function (originalMessage) {
//  var self = this;
//  self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
//    if (err) {
//      return console.error('DATABASE ERROR:', err);
//    }
//
//    var channel = self._getChannelById(originalMessage.channel);
//    self.postMessageToChannel(channel.name, record.joke, {as_user: true});
//    self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
//  });
//};


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