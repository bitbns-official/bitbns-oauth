Install
===

```bash
git clone https://github.com/bitbns-official/bitbns-oauth.git
npm install
```

Usage
===

## Locally

```bash
node server.js
```

Steps involved
===

- Serialize and deserialize user for passport

```javascript
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  var user = obj;
  done(null, user);
});
```

- Use passport-oauth2 strategy and list the parameters given below 

```javascript
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
    }); // do whatever you want to do with the data
  }
));
```

APIs
===
- Following routes have been used for client side implementation:
  - '/auth/example-oauth2orize' - for preparing the request and passing scopes along with it
  ```javascript
  router.get('/auth/example-oauth2orize', passport.authenticate('oauth2', { scope: ['name','email'] }));
  ```

  - '/auth/example-oauth2orize/callback' - for receiving the callback containing code and state
  ```javascript
  router.get('/auth/example-oauth2orize/callback', passport.authenticate('oauth2', { failureRedirect: '/close.html?error=foo' }));
  
  router.get('/auth/example-oauth2orize/callback', function (req, res) {
    res.send(req.session.passport);
  });
  ```

- Upon receiving the access token, following apis can be used to access data of the user iff their scope was requested. These are protected resources that require a token generated from the client's id and secret.


    - '/externalapi/refresh' - To generate a new accessToken along with a new refreshToken
  
  ```javascript   
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
  ```

  - '/externalapi/email' - To invoke function along with parameters

  ```javascript
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
  ```

  - '/externalapi/name' - To invoke function along with parameters

  ```javascript
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
  ```

  - '/externalapi/username' - To invoke function along with parameters

  ```javascript
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
  ```

Refer server.js for the complete implementation.

Credits - https://github.com/coolaj86/example-oauth2orize-consumer