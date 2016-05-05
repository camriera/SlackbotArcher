/**
 * Created by cameronriera on 4/21/16.
 */
'use strict';
var path = require('path');
var sqlite3 = require('sqlite3').verbose();
var outputFile = process.argv[2] || path.resolve(__dirname, 'archerbot.db');
var db = new sqlite3.Database(outputFile);
var responses = require('../data/responses');

function gatherUniqueResponseTypes(respTypes) {
  if (!respTypes) {
    console.log('No values exist in table!');
    return;
  }
  var unique_types = [];
  respTypes.forEach(function (respType) {
    if (unique_types.indexOf(respType) === -1) {
      unique_types.push(respType);
    }
  });
  return unique_types;
}

db.serialize(function () {
  //TODO need to set PRAGMA foreign_keys = ON;
  console.log('Serializing DB...');

  //always drop the table so we can seed more data
  db.run("DROP TABLE IF EXISTS responses");
  //TODO Need to create a better relational DB to be able to look up responses by `resp_type` and have them indexed

  //create the new table
  db.run("CREATE TABLE IF NOT EXISTS responses (" +
    //"id INTEGER PRIMARY KEY, " +
    "type VARCHAR(16) NOT NULL, " +
    "text TEXT NOT NULL, " +
    "last_used INT NOT NULL" +
    ")");

  console.log('Created table `responses`, successfully');

  var stmt = db.prepare("INSERT INTO responses(type, text, last_used) VALUES (?, ?, ?)");
  responses.all.forEach(function (response) {
    stmt.run(response.type, response.text, 0);
  });

  stmt.finalize();

  db.each("SELECT rowid as id, type, text, last_used as lastUsed FROM responses", function (err, row) {
    console.log(row.id + ', ' + row.type + ', ' + row.text + ', ' + row.lastUsed);
  });

  console.log('\nFINISHED SEEDING RESPONSES');
  console.log('Attempting to build lookup tables...');

  //create all the lookup tables
  /*
  db.each("SELECT DISTINCT type FROM responses", function (err, result) {
    console.log('query result is: ' + result.type);
    db.run("DROP TABLE IF EXISTS " + result.type);
    db.run("CREATE TABLE " + result.type.toLowerCase() + "(" +
      "response_id INT NOT NULL" +
        //"FOREIGN_KEY(response_id) REFERENCES responses(id) " +
      ")");

    console.log('Successfully created table ' + result.type);
    console.log('Inserting values...');

    var stmt = db.prepare("INSERT INTO " + result.type.toLowerCase() + "(response_id) VALUES (?)");
    db.each("SELECT rowid as id FROM responses WHERE type=" + result.type.toUpperCase(), function (err, row) {
      console.log('id: ' + row.id);
      stmt.run(row.id);
    });
    stmt.finalize();

    console.log('Finished seeding table ' + result.type);
  });
  /*


  /*
   db.run("SELECT DISTINCT resp_type FROM responses", function (err, rows) {
   console.log('retrieving all `resp_type`s values from DB');
   rows.map(function(type) {
   return type.toLowerCase();
   }).forEach(function (type) {
   db.run("DROP TABLE IF EXISTS " + type);
   db.run("CREATE TABLE " + type + "(" +
   "id int NOT NULL, " + //DO I NEED THIS?
   "response_id INT NOT NULL, " +
   "PRIMARY_KEY(id), " +
   "FOREIGN_KEY(response_id) REFERENCES responses(id), " +
   ")");

   var stmt = db.prepare("INSERT INTO " + type + " VALUES (response_id)");
   db.run("SELECT id FROM responses WHERE resp_type="+type.toUpperCase(), function(err, responseIds){
   rows.forEach(function (responseId) {
   stmt.run(responseId);
   })
   });
   stmt.finalize();
   });
   });

   */

  ////TODO This needs work
  //db.each("SELECT rowid AS id, info FROM archer", function (err, row) {
  //  console.log(row.id + ": " + row.info);
  //});
});

db.close();