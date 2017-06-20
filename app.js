var assert = require('assert');
var logger = require("morgan");
var path = require('path');
var express = require("express")
    , exp_session = require('express-session')
    , bodyparser = require("body-parser")
    , cookieparser = require("cookie-parser")
    , flash = require('connect-flash');

var pug = require('pug');
var request = require('request');
//var passport = require("passport")
//    , LocalStrategy = require("passport-local").Strategy;

var app = express();
app.use(logger('dev'));
app.use(cookieparser());
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.use(exp_session({
  secret: 'crazy dog',
  saveUninitialized: false,
  resave: false
}));
app.use(flash());
app.set('/views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use("/bootstrap", express.static(path.join(__dirname, "/static/bootstrap")));
app.use("/stylesheets", express.static(path.join(__dirname, "/static/stylesheets")));

app.get('/', (req, rsp) => {
  var places = [];
  //var url = 'https://jsonplaceholder.typicode.com/photos';
  var url = 'https://jsonplaceholder.typicode.com/posts';
  var img = 'http://placehold.it/150/771796'
  request.get({
    url: url,
    json: true
  }, (err, res, data) => {
    if (err) return console.log (err);
    places = data.slice(21, 30);
    console.log(places.length);
    rsp.render('index', { title: 'Hey', message: 'ok', places: places, img: img});
  });

});

port = process.env.PORT || 3000
app.listen(port);
console.log('Server listening on port ' + port);
