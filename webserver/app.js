var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var session = require('express-session');
var indexRouter = require('./routes/index');

var app = express();
var allowedOrigins = [
    'http://localhost:4200',
    'http://127.0.0.1:4200'
];

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origin is not allowed by CORS: ' + origin));
    },
    credentials: true
}));

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET must be set before starting the webserver.');
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use('/', indexRouter);
app.use(function (req, res, next) {
    next(createError(404));
});
app.use(function (err, req, res, next) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
