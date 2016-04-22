'use strict';

var util = require('util');
var fs = require('fs');
var phrasing = require('../data/phrasing');
var responses = require('../data/responses')
var Bot = require('slackbots');

const PHRASING_TRIGGER_POINT_VAL = 12;
var CANT_WONT_REGEXP = (/(i|we)\s(cant|can't)/ig);
var joinedUser = '';

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
  console.log('archer bot: ' + this.user);
  //this._connectDb();
  //this._firstRunCheck();
  //this._welcomeMessage();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
ArcherBot.prototype._onMessage = function (message) {
  console.log(message);
  if (this._isChatMessage(message) && this._isChannelOrGroupConversation(message) && !this._isFromArcherBot(message)) {
    //if(this._isReplyFromJustJoinedUser(message)){
    //  if((/wha+t/ig).test(message.text)){
    //    this._postMessage(message, pickRandom(responses.dangerZone));
    //  }
    //  joinedUser = '';
    //}
    if (this._isMentioningArcher(message)) {
      this._postMessage(message, pickRandom(responses.random));
    }
    else if (this._isTriggerCantWont(message)) {
      this._postMessage(message, 'Can\'t or won\'t?');
    }
    else if (this._isTriggerPhrasingResponse(message)) {
      this._postMessage(message, pickRandom(responses.phrasing));
    }
  }
  // else if (this._isChannelJoin(message)){
  //  var channelName = this._getChannelNameFromMessageText(message);
  //  this._replyWithDangerZoneDiatribe(message, channelName);
  //}
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

ArcherBot.prototype._isReplyFromJustJoinedUser = function (message) {
  return message.user === joinedUser.name;
};

ArcherBot.prototype._replyWithDangerZoneDiatribe = function (originalMessage, channelName) {
  var self = this;
  var name = originalMessage.user.profile.first_name || originalMessage.user.name;
  var replyCount = 0;
  while(replyCount < 3) {
    setTimeout(function () {
      self.postMessageToChannel(channelName, repeatName(name, replyCount), {as_user: true});
      replyCount++;
    }, 2000);
  }
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
};


/**
 * Sends a welcome message in the channel
 * @private
 */
ArcherBot.prototype._welcomeMessage = function () {
  console.log('replying with welcome message to channel ' + this.channels[0].name);
  console.log('replying with welcome message to group' + this.groups[0].name);
  var response = 'Was anyone looking for the worlds greatest secret agent?' +
      '\n If not, just say my name `' + this.name + '` and I\'ll be there... or not. Its not like I\'m your servant like Woodhouse';
  this._postMessage(this.channels[0].name, response);
  this._postMessage(this.groups[0].name, response);
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
ArcherBot.prototype._postMessage = function (originalMessage, response) {
  if(this._isChannelConversation(originalMessage)){
    var channel = this._getChannelById(originalMessage.channel);
    this.postMessageToChannel(channel.name, response, {as_user: true});
  }
  if(this._isGroupConversation(originalMessage)){
    var group = this._getGroupById(originalMessage.channel);
    this.postMessageToGroup(group.name, response, {as_user: true});
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
      var channelRegexp = new RegExp('\\{' + channel.name + '\\}', 'gi');
      if (channelRegexp.test(message.text)){
        isJoinedBotChannel = true;
      };
    });
  }
  return isJoinedBotChannel;
};

/**
 * Util function to pull the channel name out of the message text during from a channel_join event
 * @param message
 * @returns {*}
 * @private
 */
ArcherBot.prototype._getChannelNameFromMessageText = function (message) {
  var self = this;
  return self.channels.filter(function (channel) {
    var channelRegexp = new RegExp('\\{' + channel.name + '\\}', 'gi');
    return channelRegexp.test(message.text);
  })[0].name;
};


/**
 * Util function to check if a given real time message is mentioning Chuck Norris or the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ArcherBot.prototype._isMentioningArcher = function (message) {
  return message.text.toLowerCase().indexOf('archer') > -1 ||
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

ArcherBot.prototype._getGroupById = function (groupId) {
  return this.groups.filter(function (item) {
    return item.id === groupId;
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
  return response;
}

function pickRandom(list) {
  var idx = Math.floor(Math.random() * list.length);
  return list[idx];
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