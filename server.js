const OAuth2Strategy = require('passport-oauth2');
(function () {
  'use strict';
  var logger = require('morgan');
  const express = require('express');
  var connect = require('connect')
  var path = require('path')
  var passport = require('passport')
  var User = require('./user')
  var app = express()
  var server
  var port = process.argv[2] || 3002
  var oauthConfig = require('./oauth-config')
  var providerConfig = oauthConfig.provider
  var consumerConfig = oauthConfig.consumer
  var opts = require('./oauth-consumer-config');
  var fetch = require('node-fetch');
  var session = require('express-session');
  var cookieParser = require('cookie-parser');

  // app.set('trust proxy', 1);
  app.use(logger('dev'));
  if (!connect.router) {
    connect.router = require('connect_router');
  }
  
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    var user = obj;
    done(null, user);
  });

  passport.use(new OAuth2Strategy({
      tokenURL: providerConfig.protocol + '://' + providerConfig.host + '/oauth/token'
    , authorizationURL: providerConfig.protocol + '://' + providerConfig.host+ '/oauth/dialog/authorize'
    , clientID: opts.clientId
    , clientSecret: opts.clientSecret
    , callbackURL: consumerConfig.protocol + "://" + consumerConfig.host + "/auth/example-oauth2orize/callback"
    , pkce: true
    , state: true
    , proxy: true
    }
  , function (accessToken, refreshToken, profile, done) {
      User.findOrCreate({ profile: profile, refreshToken, accessToken }, function (err, user) {
        return done(err, user);
      });
    }
  ));

  function route(router) {
    router.get('/auth/example-oauth2orize', passport.authenticate('oauth2', { scope: ['name','email'] }));
    router.get('/auth/example-oauth2orize/callback'
    , passport.authenticate('oauth2', { failureRedirect: '/close.html?error=foo' })
    );
    router.get('/auth/example-oauth2orize/callback', function (req, res) {
        res.send(req.session.passport);
      }
    );
    router.get('/externalapi/email', function (req, res, next) {
      let options = {
        headers: {
          'Authorization': 'Bearer ' + req.user.accessToken.token
        }
      };
      let url = providerConfig.protocol + '://' + providerConfig.host + '/oauth/api'+"?scope=function3&param1=something1&params2=something2";
      fetch(url,options)
      .then(resp=>resp.json())
      .then(data=>{
        res.send(data);
      }) 
    });
    router.get('/externalapi/name', function (req, res, next) {
      let options = {
        headers: {
          'Authorization': 'Bearer ' + req.user.accessToken.token
        },
      };
      let url = providerConfig.protocol + '://' + providerConfig.host + '/oauth/api'+"?scope=function1&param1=something1&params2=something2";
      fetch(url,options)
      .then(resp=>resp.json())
      .then(data=>{
        res.send(data);
      }) 
    });
    router.get('/externalapi/username', function (req, res, next) {
      let url = providerConfig.protocol + '://' + providerConfig.host + '/oauth/api'+"?scope=function2&param1=something1&params2=something2";
      let options = {
        headers: {
          'Authorization': 'Bearer ' + req.user.accessToken.token
        }
      };

      fetch(url,options)
      .then(resp=>resp.json())
      .then(data=>{
        res.send(data);
      }) 
    });
    
    router.get('/externalapi/refresh', function (req, res, next) {
      var details = {
        refreshToken:req.user.refreshToken.token
      };
      fetch(providerConfig.protocol + '://' + providerConfig.host + '/oauth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(details)
      })
      .then(resp=>resp.json())
      .then(data=>{
        req.user.refreshToken = data.params.refresh_token;
        req.user.accessToken = data.params.access_token;
        res.send(data)
      })
    });
  }

  app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
  }))
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(passport.initialize())
  app.use(passport.session({pauseStream: true,secret: 'same_secret'}))
  app.use(connect.router(route))
  app.use(express.static(path.join(__dirname, 'public')));

  module.exports = app;

  if (require.main === module) {
    server = app.listen(port, function () {
      console.log('Listening on', server.address());
    });
  }
}());
