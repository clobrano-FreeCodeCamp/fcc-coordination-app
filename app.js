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
const db = require ('./database');

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

function add_user (database, user, callback) {
  const users = database.collection('users');
  users.insertOne (user, (err, res) => {
    assert.equal (err, null);
    callback (true);
  });
}

passport.use ('local', new LocalStrategy ((username, password, done) => {
  db.find_user ({'username': username}, (err, user) => {
    if (err) { return done(err); }
    if (!user) { return done (null, false, {'error': 'Invalid username or password'} ); };

    db.verify_password (password, user.password, res => {
      console.log('Verify returned: ' + res);
      if (res) {
        return done (null, user);
      }
      return done (null, false, {'error': 'Invalid username or password'} );
    });
  });
}));

passport.serializeUser ((user, done) => {
  done (null, user._id);
});

passport.deserializeUser ((id, done) => {
  db.find_user ({'_id': id}, (err, user) => {
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
  });
});

app.post ('/login',
    passport.authenticate ('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: 'Invalid username or password' 
    })
);

app.get ('/register', (req, rsp) => {
  rsp.render ('user-form', {
    'action': '/register',
    'title' : 'Please register',
    'buttonSubmit': 'Register',
    'buttonAlternative': 'Login',
  });
});

app.post ('/register', (req, rsp, next) => {
  db.find_user ({'username': req.body.username}, (err, user) => {
    if (err) {
      req.flash ('error', 'Unknown error');
      return rsp.redirect ('/register');
    }

    if (user) {
      req.flash ('error', 'User already exists');
      return rsp.redirect ('/register');

    }

    const new_user = {
      'username': req.body.username,
      'password': req.body.password
    }

    db.add_user (new_user, res => {
      if (res) return rsp.redirect ('/');
    });
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
console.log('Server listening on http://localhost:' + port);
