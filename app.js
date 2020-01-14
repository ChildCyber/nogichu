const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const csrf = require('csurf');
const config = require('./common/config');
const auth = require('./middlewares/auth');

const port = process.env.PORT || 3000;

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// parse application/json
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// session
app.use(session({
  secret: 'iqjmvh-178fd-fwh8f-cfenp',
  resave: false,
  saveUninitialized: false,
  cookie: {
    path: '/',
    httpOnly: true, // 开启后前端无法通过 JS 操作
    maxAge: 60 * 60 * 24 * 1000 // 过期时间：1天
  },
  store: new MongoStore({url: config.mongoUrl + '/' + config.dbName})
}));
app.use(csrf({cookie: true}));
app.use(auth.ejsVar);

app.use('/', require('./routes/index'));
app.use('/', require('./routes/user'));
app.use('/', require('./routes/password'));
app.use('/', require('./routes/pay'));
app.use('/nogizaka-member', require('./routes/member'));
app.use('/page', require('./routes/page'));
app.use('/blog', require('./routes/blog'));
app.use('/ticket', require('./routes/ticket'));

/**
 * 404页面
 */
app.get('*', (req, res) => {
  res.status(404).render('404.ejs', req.ev);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(config.mongoUrl);
client.connect((err) => {
  if (err) {
    console.error(err);
  }
  console.log("Connected successfully to server");
  app.locals.db = client.db('nogi');

  app.listen(port, () => {
    console.log('Example app listening on port 3000!');
  });

});

module.exports = app;
