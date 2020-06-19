/**
 * Created by cameronriera on 4/21/16.
 */
'use strict';
var path = require('path');
var sqlite3 = require('sqlite3').verbose();
var outputFile = process.argv[2] || path.resolve(__dirname, 'archerbot.db');
var db = new sqlite3.Database(outputFile);
var responses = require('../data/responses');

db.serialize(function () {
  console.log('Serializing DB...');

  //always drop the table so we can seed more data
  db.run("DROP TABLE IF EXISTS responses");

  //create the new table
  console.log('Creating table `responses`...');
  db.run("CREATE TABLE IF NOT EXISTS responses (" +
    "id INTEGER PRIMARY KEY, " +
    "type TEXT NOT NULL, " +
    "text TEXT NOT NULL, " +
    "last_used INTEGER NOT NULL" +
    ")");
  console.log('Creating table `responses`, SUCCESSFUL');

  console.log('Seeding responses table...');
  var stmt = db.prepare("INSERT INTO responses(id, type, text, last_used) VALUES (?, ?, ?, ?)");
  responses.all().forEach(function (response) {
    stmt.run(null, response.type, response.text, 0);
  });
  stmt.finalize();
  console.log('Seeding `responses` SUCCESSFUL!');

  console.log('Building index on responses `type` column...');
  db.run("CREATE INDEX IF NOT EXISTS idx_type ON responses(type)");
  console.log('Building index SUCCESSFUL!');
});
db.close();