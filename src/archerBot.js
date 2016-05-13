'use strict';

var util = require('util');
var fs = require('fs');
var phrasing = require('../data/phrasing');
var responses = require('../data/responses');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

const PHRASING_TRIGGER_POINT_VAL = 10;
var CANT_WONT_REGEXP = (/(i|we)\s(cant|can’t)/ig);
var JOIN_RESPONSE = (/wh*?a+t|yes|yeah?|shut.*up|wu+t|no/ig);
var VOWEL_REGEXP = (/a|e|i|o|u|y/ig);
var DANGER_ZONE_REGEXP =
  /((danger|peril|trouble|unsafe|deadly|precarious|risky)+.*(zone|area|place|location|spot|realm|territory|section)+|(zone|area|place|location|spot|realm|territory|section)+.*(danger|peril|trouble|unsafe|deadly|precarious|risky)+)/ig;


var joinedUsers = {};

/**
 * Constructor function. It takes settings object with the following keys:
 *    token : the private API token to log the bot into slack (required)
 *    name  : the name of the bot (default 'archer')
 *    dbPath: the path to access the database seeded from responses (default 'data/archerbot.db')
 * @param settings
 * @constructor
 */
var ArcherBot = function Constructor(settings) {
  this.settings = settings;
  this.settings.name = this.settings.name || 'archer';
  this.dbPath = settings.dbPath;

  this.user = null;
  this.db = null;
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
  this._connectDb();
  //this._welcomeMessage();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
ArcherBot.prototype._onMessage = function (message) {
  if (this._isChatMessage(message) && this._isChannelGroupOrDMConversation(message) && !this._isFromArcherBot(message)) {
    console.log(message);
    if (this._isChannelOrGroupJoin(message)) {
      addJoinedUser(message);
      this._replyWithDangerZoneDiatribe(message);
    }
    else if (this._isChannelOrGroupLeave(message)){
      if(this._isFromNewlyJoinedUser(message)){
        removeJoinedUser(message);
      }
      this._replyWithResponse('LEAVE', message);
    }
    else if (this._isFromNewlyJoinedUser(message)) {
      if (JOIN_RESPONSE.test(message.text)) {
        this._replyWithResponse('JOIN', message);
        removeJoinedUser(message);
      }
    }
    else if (this._isTriggerPhrasingResponse(message)) {
      this._replyWithResponse('PHRASING', message);
    }
    else if(this._isTriggerDangerZoneResponse(message)) {
      this._replyWithResponse('DANGER_ZONE', message);
    }
    else if (this._isTriggerCantWont(message)) {
      this._postMessage(message, 'Can\'t or won\'t?');
    }
    else if (this._isMentioningArcher(message)) {
      this._replyWithResponse('RANDOM', message);
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
  return phrasing.isPhrasing(message.text, PHRASING_TRIGGER_POINT_VAL);
};

/**
 * Checks whether the mssage contains values for a danger zone response
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isTriggerDangerZoneResponse = function (message) {
  return DANGER_ZONE_REGEXP.test(message.text);
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
ArcherBot.prototype._isFromNewlyJoinedUser = function (message) {
  return joinedUsers[message.channel] ? joinedUsers[message.channel].id === message.user : false;
};

/**
 * Replys to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
ArcherBot.prototype._replyWithRandomResponse = function (originalMessage) {
  var self = this;
  self.db.get('SELECT id, text FROM responses WHERE type=\"RANDOM\" ORDER BY last_used ASC, RANDOM() LIMIT 1', function (err, record) {
    if (err) {
      return console.error('DATABASE ERROR:', err);
    }
    self._postMessage(originalMessage, record.text);
    self.db.run('UPDATE responses SET last_used = ? WHERE id = ?', [new Date().valueOf(), record.id]);
  });
};

ArcherBot.prototype._replyWithResponse = function (type, originalMessage) {
  var self = this;
  self.db.get('SELECT id, text FROM responses WHERE type=? ORDER BY last_used ASC, RANDOM() LIMIT 1', type.toUpperCase(), function (err, record) {
    if (err) {
      return console.error('DATABASE ERROR:', err);
    }
    self._postMessage(originalMessage, record.text);
    self.db.run('UPDATE responses SET last_used = ? WHERE id = ?', [new Date().valueOf(), record.id]);
  });
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

  if(replyCount > 3 || !joinedUsers[originalMessage.channel]){
    if(self._replyWithDangerZoneDiatribe.timeout[user.id]) {
      clearTimeout(self._replyWithDangerZoneDiatribe.timeout[user.id]);
    }
    return;
  }

  var increment = replyCount + 1;
  self._replyWithDangerZoneDiatribe.timeout[user.id] = setTimeout(function () {
    self._postMessage(originalMessage, repeatName(name, replyCount), self._replyWithDangerZoneDiatribe(originalMessage, increment));
  }, 2000);
};

//cache timeouts
ArcherBot.prototype._replyWithDangerZoneDiatribe.timeout = {};

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
* Open connection to the db
* @private
*/
ArcherBot.prototype._connectDb = function () {
  console.log('dbPath is ' + this.dbPath);
  if (!fs.existsSync(this.dbPath)) {
    console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
    process.exit(1);
  }
  this.db = new SQLite.Database(this.dbPath);
};

/**
 * Sends a welcome message in the channel
 * @private
 */
ArcherBot.prototype._welcomeMessage = function () {
  var self = this;
  if(this.channels) {
    this.channels.forEach(function (channel) {
      if (channel.is_member) {
        console.log('posting message to channel '+ channel.name);
        self._postMessage({type: 'message', channel: channel.id}, responses.welcome);
      }
    });
  }
  if(this.groups){
    this.groups.forEach(function (group) {
      if(group.is_member){
        console.log('posting message to group'+ group.name);
        self._postMessage({type: 'message', channel: group.id}, responses.welcome);
      }
    });
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
 * Util function to check if a given real time message is a Direct Message to a user
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isDMConversation = function (message) {
  return typeof message.channel === 'string' && message.channel[0] === 'D';
};

/**
 * Util function to check if a given real time message object is directed to a Channel, Group, DM
 * @param message
 * @returns {boolean}
 */
ArcherBot.prototype._isChannelGroupOrDMConversation = function (message) {
  return this._isChannelConversation(message) ||
      this._isGroupConversation(message) ||
      this._isDMConversation(message);
};

/**
 * Util function to post message either to channel or group
 * @param originalMessage
 * @param response
 * @private
 */
ArcherBot.prototype._postMessage = function (originalMessage, response) {
  this.postMessage(originalMessage.channel, response, {as_user:true});
};

/**
 * Util function to check if a given real time message object is because of a channel_join event
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isChannelJoin = function (message) {
  return message.subtype === 'channel_join';
};

/**
 * Util function to check if channel_leave event
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isChannelLeave = function (message){
  return message.subtype === 'channel_leave';
};

/**
 * Util function to check if a group_join
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isGroupJoin = function (message) {
  return message.subtype === 'group_join';
};

/**
 * Util function to check if group_leave event
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isGroupLeave = function (message){
  return message.subtype === 'group_leave';
};

/**
 * Util function to check if channel or group joins event
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isChannelOrGroupJoin = function (message) {
  return this._isChannelJoin(message) || this._isGroupJoin(message);
};

/**
 * Util function to check if channel or group leave event occurs
 * @param message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isChannelOrGroupLeave = function (message) {
  return this._isChannelLeave(message) || this._isGroupLeave(message);
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
  if(!name){
    return;
  }
  var lastVowelIndex, vowelToExpand;
  for(var i = name.length-1; i >= 0; i--){
    if(VOWEL_REGEXP.test(name.charAt(i))){
      lastVowelIndex = i;
      vowelToExpand = name.charAt(i);
      break;
    }
  }
  if(!vowelToExpand){
    return;
  }
  var nameBegin = name.slice(0, lastVowelIndex);
  var nameEnd = name.slice(lastVowelIndex, name.length);

  name = nameBegin + vowelToExpand.repeat(5) + nameEnd + '!';
  return name.toUpperCase();
}

function addJoinedUser(msg){
  if(!joinedUsers[msg.user]) {
    joinedUsers[msg.channel] = {
      id: msg.user,
      timeout: setTimeout(function () {
        delete joinedUsers[msg.channel];
      }, 15 * 60 * 1000)
    }
  }
}

function removeJoinedUser (msg){
  if(joinedUsers[msg.channel]){
    console.log('clearing timeout for user '+ msg.user);
    clearTimeout(joinedUsers[msg.channel].timeout);
    if(ArcherBot.prototype._replyWithDangerZoneDiatribe.timeout[msg.user]){
      clearTimeout(ArcherBot.prototype._replyWithDangerZoneDiatribe.timeout[msg.user]);
    }
    delete joinedUsers[msg.channel];
  }
}

function pluckResponse(originalMessage, type){
  var self = ArcherBot;
  self.db.get('SELECT id, text FROM responses WHERE type=\"'+type.toUpperCase()+'\" ORDER BY last_used ASC, RANDOM() LIMIT 1', function (err, record) {
    if (err) {
      return console.error('DATABASE ERROR:', err);
    }
    self.prototype._postMessage(originalMessage, record.text);
    self.db.run('UPDATE responses SET last_used = ? WHERE id = ?', [new Date().valueOf(), record.id]);
  });
}

module.exports = ArcherBot;