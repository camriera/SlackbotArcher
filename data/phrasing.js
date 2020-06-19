/**
 * Created by cameronriera on 4/21/16.
 */

'use strict';

const SENTENCE_REGEXP =  new RegExp('[^\.!\?]+[\.!\?]+', 'g');

const adjectives = {
  'hard': 7,
  'soft': 3,
  'rigid': 3,
  'creamy': 5,
  'tight': 4,
  'loose': 4,
  'swollen': 8,
  'long': 3,
  'veiny': 8,
  'salty': 5,
  'juicy': 6,
  'wet': 5,
  'moist': 7,
  'frothy': 7,
  'hot': 4,
  'dripping': 5,
  'soaking': 4,
  'dirty': 3,
  'spanking': 3,
  'wild': 3,
  'slutty': 5,
  'naughty': 4,
  'stanky': 4,
  'sweaty': 5,
  'orgasmic': 8,
  'horny': 8,
  'musky': 5,
  'steamy': 4,
  'bad': 3,
  'tasty': 3,
  'dead':1,
  'sexy': 5,
  'black': 4,
  'dry': 3,
  'drunk': 3,
  'round': 4,
  'big': 5,
  'large': 4,
  'thin': 2,
  'purple': 2,
  'blond': 5,
  'asian': 4,
  'vigorously': 5,
  'hardening': 5,
  'spunk': 10
};

const nouns = {
  'ass': 4,
  'anal': 5,
  'asshole': 5,
  'ball': 4,
  'boob': 4,
  'seed': 5,
  'blood': 3,
  'rock': 3,
  'booty': 4,
  'bum': 4,
  'banana': 5,
  'boner': 5,
  'cock': 4,
  'cream': 4,
  'hooker': 5,
  'loins': 6,
  'mother': 3,
  'pole': 5,
  'pie': 3,
  'box': 4,
  'shaft': 5,
  'hole': 4,
  'face': 4,
  'popsicle': 3,
  'chicken': 2,
  'sausage': 6,
  'dick': 5,
  'crack': 2,
  'red': 5,
  'club': 3,
  'bat': 4,
  'clam': 6,
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
  'worm': 5,
  'staff': 4,
  'flower': 3,
  'joystick': 5,
  'stick': 5,
  'wood': 5,
  'flute': 4,
  'skin': 4,
  'snake': 5,
};

const verbs = {
  'rub': 4,
  'bury': 2,
  'spank': 4,
  'touch': 4,
  'lick': 5,
  'sploosh': 6,
  'spluge': 8,
  'fuck': 3,
  'bound': 3,
  'beat': 6,
  'fist': 7,
  'milk': 6,
  'bite': 4,
  'eat': 3,
  'ate': 2,
  'violate': 2,
  'penetrate': 6,
  'poke': 3,
  'probe': 5,
  'fresh': 4,
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
  'came': 3,
  'come': 3,
  'coming': 5,
  'ooze': 3,
  'pull': 5,
  'tug': 5,
  'jack': 5,
  'jerk': 5,
  'grind': 4
};

const phrases = [
  '(you|he|she)\\scoming\\?',
  'hard\\sat\\swork'
  //TODO add more direct phrasing triggers
];

/**
 * Tests the sentences for phrasing
 * @param msg
 * @param TRIGGER_VAL
 * @returns {boolean}
 */
 function isPhrasing(msg, TRIGGER_VAL) {
    let sentences = msg.match(SENTENCE_REGEXP);
    if (!sentences || sentences.length === 0) {
      sentences = [msg];
    }

    //test against keywords
    for (const sentence of sentences) {
      let pointVal = 0;
      const words = sentence.split(' ');
      
      for (const word of words) {
        for (const keyword of [adjectives, verbs, nouns]) {
          pointVal += calcPhrasingScore(keyword, word, pointVal);
        }
      }

      if (pointVal >= TRIGGER_VAL) {
        return true;
      }
    }

    //test against explicit regex
    return phrases.some(phrase => {
      const phraseRegex = new RegExp(phrase, 'gi');
      return phraseRegex.test(msg);
    });
};

function calcPhrasingScore(wordMap, word) {
  var pointVal = 0;
  Object.keys(wordMap).forEach((key) => {
    const regexp = new RegExp('^'+key, 'gi');
    if(regexp.test(word)){
      pointVal += wordMap[key];
    }
  });
  return pointVal;
}

module.exports = {
  adjectives,
  nouns,
  verbs,
  phrases,
  isPhrasing
};