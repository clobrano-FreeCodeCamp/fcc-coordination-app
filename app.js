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

    db.verify_password (password, user.hash, res => {
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

const location = 'cagliari, it';

app.get('/', (req, rsp) => {
  if (req.user) {
      loggedin = true;
      username = req.user.username;
  } else {
      loggedin = false;
      username = null;
  }

  const places = [];
  get_places(location, (err, places) => {
    var date = getDate ();
    var waiting = 0;

    for (var p in places) {
      var place = places [p];
      var data = {};

      // Setting default pic if not there already
      place.image_url = place.image_url || '/img/silverware-1667988_640.png';

      // Get the number of people going to this place today
      data [date] = place.name + place.location.display_address;
      data.transaction_id = p;
  
      waiting++;
      db.get_people_going_to (data, (tr_id, people) => {
        if (people.length) {
          places[tr_id].going = people.length;
        } else {
          places[tr_id].going = 0;
        }

        waiting--;
        if (!waiting)
          rsp.render('index', {
              'loggedin': loggedin,
              'username': username,
              places: places
          });
      });
    }
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

    db.add_user (new_user, (res, registered_user) => {
      if (res) {
        req.login (registered_user, (err) => {
          if (err) return next (err);
          rsp.redirect ('/');
        });
      }
    });
  });
});


app.get ('/logout', (req, rsp) => {
  req.logout ();   
  rsp.redirect ('/');
});

function getDate () {
  const now = new Date ();
  var dd = now.getDate ();
  var mm = now.getMonth () + 1;
  var yyyy = now.getYear () + 1900;

  dd = dd < 10? '0' + dd : dd;
  mm = mm < 10? '0' + mm : mm;

  return dd + '-' + mm + '-' + yyyy;
}

app.post ('/going/:id',
  require ('connect-ensure-login').ensureLoggedIn(),
  (req, rsp) => {
    var user = req.user;
    var id = req.params.id;

    get_places (location, (err, places) => {
      var place = places[id];
      var today = getDate ();

      user[today] = place.name + place.location.display_address;
      
      db.update_user (user, res => {
        rsp.redirect ('/');
      });

    });
});

port = process.env.PORT || 3000
app.listen(port);
console.log('Server listening on http://localhost:' + port);
