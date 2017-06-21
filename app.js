const assert = require ('assert');
const logger = require ("morgan");
const path = require ('path');
const express = require ("express")
    , exp_session = require ('express-session')
    , bodyparser = require ("body-parser")
    , cookieparser = require ("cookie-parser")
    , flash = require ('connect-flash');
const pug = require ('pug');
const request = require ('request');
const get_places = require ('./yelp').get_places
const passport = require ("passport")
    , LocalStrategy = require ("passport-local").Strategy;
const on_connect = require ('./database.js');

const app = express();
app.use (logger('dev'));
app.use (cookieparser());
app.use (bodyparser.urlencoded({extended: false}));
app.use (bodyparser.json());
app.use (flash());
app.use (exp_session({
  secret: 'crazy dog',
  saveUninitialized: false,
  resave: false
}));
app.use (passport.initialize());
app.use (passport.session());

app.set ('/views', path.join(__dirname, 'views'));
app.set ('view engine', 'pug');
app.use ("/bootstrap", express.static(path.join(__dirname, "/static/bootstrap")));
app.use ("/stylesheets", express.static(path.join(__dirname, "/static/stylesheets")));
app.use ("/img", express.static(path.join(__dirname, "/static/img")));

function find_user (database, filter, callback) {
  const users = database.collection('users');
  users.findOne (filter, (err, user) => {
    callback (err, user);
  });
}

passport.use ('local', new LocalStrategy ((username, password, done) => {
  on_connect (find_user, {'username': username}, (err, user) => {
    if (err) { return done(err); }

    verifyPassword (password, user.password, res => {
      if (res) { return done (null, user); }
      return done (null, false, {'error': 'Could not find user'});
    });
  });
}));

passport.serializeUser ((user, done) => {
  done (null, user._id);
});

passport.deserializeUser ((id, done) => {
  on_connect (find_user, {'_id': id}, (err, user) => {
    if (err) { return done (err); }
    return done (null, user);
  });
});

app.get('/', (req, rsp) => {
  const places = [];
  get_places('cagliari, it', (err, places) => {
    places.map (place => {
      place.image_url = place.image_url || '/img/silverware-1667988_640.png';
    });
    rsp.render('index', { places: places });
  });
});

app.get ('/login', (req, rsp) => {
  rsp.render ('user-form', {
    'action': '/login',
    'title' : 'Please login',
    'buttonSubmit': 'Login',
    'buttonAlternative': 'Register',
    'error': req.flash('error')
  });
});

app.post ('/going',
  require ('connect-ensure-login').ensureLoggedIn(),
  (req, rsp) => {
    console.log(req.user)
    rsp.redirect ('/');
});

port = process.env.PORT || 3000
app.listen(port);
console.log('Server listening on port ' + port);
