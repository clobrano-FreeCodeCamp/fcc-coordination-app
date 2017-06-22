var mongodb = require('mongodb');
var assert = require('assert');

var user = process.env.MONGO_USER;
var pass = process.env.MONGO_PASSWORD;

if (user && pass) {
    var url = 'mongodb://' + user + ':' + pass + '@ds111262.mlab.com:11262/voting-app';
} else {
    var url = 'mongodb://localhost:27017/test';
}


const Database = function () {
  this.on_connect = function (action, userdata, callback) {
    mongodb.connect (url, (err, db) => {
      assert.equal (null, err);
      action (db, userdata, callback);
    });
  },

  this.verify_password = function (plain_password, user_password, callback) {
    return callback (false);
  }
};

module.exports = new Database;
