const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

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
app.use(express.urlencoded({ extended: false }));
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
  store: new MongoStore({url: 'mongodb://localhost:27017/nogi'})
}));

app.use('/', require('./routes/index'));
app.use('/', require('./routes/user'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
const client = new MongoClient('mongodb://localhost:27017');
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
