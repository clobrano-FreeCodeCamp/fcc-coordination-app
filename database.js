var mongodb = require ('mongodb');
var assert = require ('assert');
var bcrypt = require ('bcryptjs');

var user = process.env.MONGO_USER;
var pass = process.env.MONGO_PASSWORD;

if (user && pass) {
    var url = 'mongodb://' + user + ':' + pass + '@ds111262.mlab.com:11262/voting-app';
} else {
    var url = 'mongodb://localhost:27017/coordapp';
}

on_connect = function (action, userdata, callback) {
  mongodb.connect (url, (err, db) => {
    assert.equal (null, err);
    action (db, userdata, callback);
  });
}

function _find_user (database, filter, callback) {
  console.log ('Looking for: ' + JSON.stringify (filter));
  const users = database.collection('users');
  users.findOne (filter, (err, user) => {
    callback (err, user);
  });
}

function _add_user (database, user, callback) {
  const iterations = 5;
  bcrypt.hash (user.password, iterations, (err, hash) => {
    assert.equal (err, null);

    const newuser = {
      'username': user.username,
      'hash': hash
    };

    const users = database.collection ('users');
    users.insertOne (newuser, (err, res) => {
      assert.equal (err, null);
      callback (res);
    });
  });
}


const Database = function () {
  this.verify_password = function (plain_password, user_password, callback) {
    callback (false);
  },

  this.find_user = (filter, callback) => {
    on_connect (_find_user, filter, callback);
  },

  this.add_user = (user, callback) => {
    on_connect (_add_user, user, callback);
  }
};

module.exports = new Database;
