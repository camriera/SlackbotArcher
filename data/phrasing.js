/**
 * Created by cameronriera on 4/21/16.
 */

'use strict';

var adjectives = {
  'hard': 5,
  'soft': 3,
  'rigid': 3,
  'creamy': 5,
  'tight': 4,
  'loose': 4,
  'swollen': 7,
  'veiny': 7,
  'salty': 5,
  'juicy': 5,
  'wet': 5,
  'moist': 7,
  'frothy': 7,
  'hot': 2,
  'dripping': 5,
  'soaking': 4,
  'dirty': 3,
  'spanking': 3,
  'wild': 3,
  'slutty': 5,
  'naughty': 4,
  'stanky': 4,
  'sweaty': 3,
  'orgasmic': 7,
  'horny': 8,
  'musky': 5,
  'steamy': 4,
  'bad': 3,
  'tasty': 3,
  'dead':1,
  'sexy': 4,
  'black': 3,
  'dry': 2,
  'drunk': 3,
  'round': 3,
  'big': 3,
  'large': 2,
  'thin': 2,
  'purple': 2,
  'blonde': 5,
  'asian': 4
};

var nouns = {
  'ass': 4,
  'anal': 5,
  'asshole': 5,
  'ball': 4,
  'balls': 5,
  'boob': 4,
  'boobies': 4,
  'boobs': 4,
  'blood': 3,
  'booty': 4,
  'bum': 4,
  'banana': 5,
  'boner': 5,
  'cock': 4,
  'hooker': 5,
  'loins': 6,
  'mother': 3,
  'pole': 4,
  'shaft': 4,
  'hole': 4,
  'face': 3,
  'popsicle': 3,
  'chicken': 2,
  'dick': 4,
  'crack': 2,
  'red': 5,
  'club': 3,
  'bat': 4,
  'bed': 4,
  'job': 2,
  'foot': 2,
  'hand': 2,
  'orifice': 3,
  'mouth': 3,
  'tongue': 3,
  'butt': 3,

  'member': 2,
  'hair': 1,
  'head': 3,
  'tip': 3,
  'organ': 3,
  'rod': 4,
  'staff': 4,
  'flower': 3,
};

var verbs = {
  'rub': 4,
  'bury': 2,
  'spank': 4,
  'touch': 4,
  'lick': 5,
  'sploosh': 6,
  'spluge': 6,
  'fuck': 3,
  'bite': 4,
  'eat': 3,
  'ate': 2,
  'violate': 2,
  'penetrate': 5,
  'poke': 3,
  'probe': 5,
  'stroke': 5,
  'thrust': 5,
  'pump': 4,
  'slam': 3,
  'swallow': 5,
  'throb': 7,
  'pulse': 7,
  'ache': 4,
  'overflow': 3,
  'rise': 2,
  'nibble': 4,
  'pet': 3,
  'edge': 2,
  'surge': 2,
  'squirm': 4,
  'expand': 3,
  'burst': 3,
  'climax': 5,
  'erupt': 6,
  'spurt': 6,
  'explode': 6,
  'came':3,
  'come':3
};

var countPhrasingScore = function(msg){
  var words = msg.split(' ');
  var pointVal = 0;
  words.forEach(function (word) {
    pointVal += adjectives[word] || 0;
    pointVal += nouns[word] || 0;
    pointVal += verbs[word] || 0;
  });

  return pointVal;
};

module.exports = {
  adjectives : adjectives,
  nouns: nouns,
  verbs: verbs,
  phrasingScore: countPhrasingScore,
};