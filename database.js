const mongodb = require ('mongodb');
const assert = require ('assert');
const bcrypt = require ('bcryptjs');

const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASSWORD;

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
  if (filter._id) {
    const old_id = filter._id
    filter._id = mongodb.ObjectId (old_id);
  }

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
      callback (res, newuser);
    });
  });
}

function _update_user (database, user, callback) {
  const users = database.collection ('users');
  users.update (
    {'_id': user._id},
    user, 
    {upsert: true}
  );
  callback(true);
}

function _get_people_going_to (database, data, callback) {
  const users = database.collection ('users');
  const filter = data;
  const transaction_id = data.transaction_id;

  delete filter.transaction_id;

  users.find(filter).toArray ((res, people) =>{
    callback (transaction_id, people);
  });
}


const Database = function () {
  this.verify_password = function (plain_password, user_password, callback) {
    const iterations = 5;
    bcrypt.compare (plain_password, user_password, (err, res) => {
      if (err) {
        console.log ('auth: hashing error ' + err);
        return callback (false);
      }

      return callback (res);
    });
  },

  this.find_user = (filter, callback) => {
    on_connect (_find_user, filter, callback);
  },

  this.add_user = (user, callback) => {
    on_connect (_add_user, user, callback);
  },

  this.update_user = (updated_user, callback) => {
    on_connect (_update_user, updated_user, callback);
  },

  this.get_people_going_to = (data, callback) => {
    on_connect (_get_people_going_to, data, callback);
  }
};

module.exports = new Database;
