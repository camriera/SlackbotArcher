#!/usr/bin/env node

'use strict';

/**
 * ArcherBot launcher script.
 */

const ArcherBot = require('../src/archerBot');

/**
 * Environment variables used to configure the bot:
 *
 *  BOT_API_KEY : the authentication token to allow the bot to connect to your slack organization. You can get your
 *      token at the following url: https://<yourorganization>.slack.com/services/new/bot (Mandatory)
 *  BOT_DB_PATH: the path of the SQLite database used by the bot
 *  BOT_NAME: the username you want to give to the bot within your organization.
 *  BOT_USE_GIFS: configurable option to respond with GIFs (DEFAULTS to true)
 */
const token = process.env.BOT_API_KEY || require('../token');
const dbPath = process.env.BOT_DB_PATH || 'data/archerbot.db';
const name = process.env.BOT_NAME || 'archer';
const useGIFs = process.env.BOT_USE_GIFS || true;

const archerbot = new ArcherBot({token, dbPath, name, useGIFs});

archerbot.run();

