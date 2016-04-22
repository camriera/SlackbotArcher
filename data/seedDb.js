/**
 * Created by cameronriera on 4/21/16.
 */
var sqlite3 = require('sqlite3').verbose();
var phrasing = require('phrasing');
var db = new sqlite3.Database(':memory:');

db.serialize(function() {
  db.run("CREATE TABLE phrasing (" +
      "WORD TEXT NOT NULL, " +
      "POINT_VAL INT NOT NULL" +
    ")");

  var stmt = db.prepare("INSERT INTO archer VALUES (WORD, POINT_VAL)");

  for (var i = 0; i < 10; i++) {
    stmt.run("Ipsum " + i);
  }
  stmt.finalize();

  db.each("SELECT rowid AS id, info FROM archer", function(err, row) {
    console.log(row.id + ": " + row.info);
  });
});

db.close();