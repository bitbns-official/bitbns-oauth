The code provided above is an implementation of the PKCE Flow stated below.


Before proceeding further, visit the bitbns website and generate clientId and clientSecret.

# PKCE Flow
The PKCE extension prevents an attack where the authorization code is intercepted and exchanged for an access token by a malicious client, by providing the authorization server with a way to verify the same client instance that exchanges the authorization code is the same one that initiated the flow.

## Step 1. Redirect users to request Bitbns access and set authorization parameters.

`
GET https://oauth.bitbns.com/oauth/dialog/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&state=CSRF_TOKEN&scope=SCOPES&code_challenge=YOUR_CODE_CHALLENGE&code_challenge_method=S256
`

When redirecting a user to Bitbns to authorize access to your application, your first step is to create the authorization request. You need create and store a new PKCE code_verifier, also will be used in STEP4 Here is an Example of javascript generate code_verifier:
```javascript
// Generate a secure random string using the browser crypto functions
function generateRandomString() {
  var array = new Uint32Array(28);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join(
    ""
  );
}
```

| Paramter | Description |
| --- | --- |
| response_type | <b>Required Value</b> `code` |
| client_id | <b>Required</b> The client ID of your application. |
| redirect_uri | <b>Required</b> The URL in your web application where users will be redirected after authorization. This value needs to be URL encoded.|
|state|<b>Required</b> The CSRF token to protect against CSRF (cross-site request forgery) attacks.|
|scope|<b>Required</b> List of scopes your application requests access to, with space  seperated|
|code_challenge|<b>Required</b> Hash and base64-urlencode of code_verifier|
|code_challenge_method|<b>Required</b> Method used to encrpyt should be `S256`|

Here is an example of javascript generate code_challenge
```javascript
// Calculate the SHA256 hash of the input text.
function sha256(code_verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(code_verifier);
  return window.crypto.subtle.digest("SHA-256", data);
}

// Base64-urlencodes the input string
function base64urlencode(hashed) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(hashed)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Return the base64-urlencoded sha256 hash for the PKCE challenge
async function generateCodeChallenge(code_verifier) {
  hashed = await sha256(code_verifier);
  return base64urlencode(hashed);
}
```

Here is an Example of an authorization URL:

`GET https://oauth.bitbns.com/oauth/dialog/authorize?response_type=code&redirect_uri=https%3A%2F%2Fdomain.com%2Foauth%2Fcallback&scope=name%20email&code_challenge=ARU184muFVaDi3LObH5YTZSxqA5ZdYPLspCl7wFwV0U&code_challenge_method=S256&state=377f36a4557ab5935b36&client_id=client1`

`curl --request GET 'https://oauth.bitbns.com/oauth/dialog/authorize?response_type=code&redirect_uri=https%3A%2F%2Fdomain.com%2Foauth%2Fcallback&scope=name%20email&code_challenge=ARU184muFVaDi3LObH5YTZSxqA5ZdYPLspCl7wFwV0U&code_challenge_method=S256&state=377f36a4557ab5935b36&client_id=client1'`

## Step 2. Bitbns prompts user for consent

In this step, the user decides whether to grant your application the requested access. At this stage, Bitbns displays a consent window that shows the name of your application and the Bitbns API services that it is requesting permission to access with the user's authorization credentials. The user can then consent or refuse to grant access to your application.

Your application doesn't need to do anything at this stage as it waits for Bitbns's OAuth 2.0 server to redirect back.

## Step 3. Bitbns redirects back to your application

If the user approves your application, Bitbns's OAuth server will redirect back to your redirect_uri with a temporary authorization code parameter.

The state parameter will be included as well. If you generate a random string or encode the hash of a cookie or another value that captures the client's state, you can validate the response to additionally ensure that the request and response originated in the same browser, providing protection against attacks such as cross-site request forgery.

Example of the redirection:

`GET https://domain.com/oauth/callback?code=cf6941ae8918b6a008f1377f36a4557ab5935b36&state=377f36a4557ab5935b36`

> <b>state</b> is the same as the one in step 1

## Step 4. Exchange authorization code for refresh and access tokens
After your application receives the authorization code, it can exchange the authorization code for an access token, which can be done by make a POST call:

`POST https://oauth.bitbns.com/oauth/token?client_id=YOUR_CLIENT_ID&code_verifier=STEP1_CODE_VERIFIER&grant_type=authorization_code&code=STEP3_CODE&redirect_uri=YOUR_REDIRECT_URI
`


|Parameter|Description|
|--|--|
|grant_type| **Required** Value `authorization_code`|
|code| **Required** Step3 return code|
|client_id| **Required** The client ID of your application.|
|code_verifier|	**Required** The random secret code created and stored in STEP1|
|redirect_uri|	**Required** The URL in your web application where users will be redirected after authorization. This value needs to be URL encoded.|

Example POST call:

To set authorization header:

Encode `clientId:clientSecret` using base64urlencode.

Example `client1:secret1` becomes `Y2xpZW50MTpzZWNyZXQx`

`
curl --request POST 'https://oauth.bitbns.com/oauth/token' \
--header 'Authorization: Basic Y2xpZW50MTpzZWNyZXQx' \
--header 'Content-Type: application/json' \
--data-raw '{
    "grant_type": "authorization_code",
    "redirect_uri": "https://domain.com/oauth/callback",
    "code_verifier": "65a4ecce1fe857067bec7a6887529531831ebe38e32da95fe0f322a2",
    "client_id": "client1",
    "code":"cf6941ae8918b6a008f1377f36a4557ab5935b36"
}
'
`

After a successful request, a valid access_token will be returned in the response.

Here is an example response:

```javascript
{
   "refreshToken":{
      "token":"sFDMZM9KJIu4kzGRS4HaxNB3GZFJ4e5HdE8tSxOPORNZZleytNefpYj8NHsZLF7V6LX9ItWNQOwi3UJs9zhvOdy146kxFo40SmuK9DlorUaZcOjbZOYmX2Hd14h3Hxyv1M39dz7GyEOPnxDq5mnGbMFrGRQALQF00qFAMu6SNzEU9Hn0T7Pw6w1Vx64rYXokdFz99okCkXUdJZzEjJ759YUNw7RlfeltsRG8C1dRAs7JcS5HKg0EuIdxiPXpOioX",
      "expiresAt":1622056620946
   },
   "accessToken":{
      "token":"ZsMLsdEkHZ3Shdvw7CHwL0MuMfHjZX66VLYSVcyd0PZNdubG3lLAwtjjcb0usFWiPohSihL9XYU3oFqba4m67LNZFW21d91iwG9JrSgWfRaoPq304MLbpnADpwBo3ARB0uOyjdhGsb4PpCMFpCCR0IY5mAUFHCmZJpylXI6QKySm5H3uxejfXrZFTpqfsxxJWWtBhsq8E06f22lE04VVSAWLDZVPx908yr8W6PxO4vcZzpiNh1CPq2VCEtXH1pgQ",
      "expiresAt":1622050220946
   },
   "scope":"name email",
   "token_type": "Bearer"
}
````

## Step 5. Calling Bitbns APIs

After you have a valid access_token, you can make your first API call:

`curl -XPOST -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' 'https://oauth.bitbns.com/oauth/api?function=functionName&param1=something&param2=something2'`

Response:
```javascript
{
	data:"Order placed successfully"
}
```
Here is the POSTMAN collection link for all supported APIS. - https://documenter.getpostman.com/view/141690/TzeUmTaY

## Step 6. Keep updating your refresh token and access token 
After your application receives the refresh token, it can be exchanged for a new pair of refresh and access token pair time to time, which can be done by make a POST call:

`POST https://oauth.bitbns.com/oauth/refresh?refreshToken=YOUR_OLD_REFRESH_TOKEN
`


|Parameter|Description|
|--|--|
|refresh_token| **Required** Refresh code obtained in Step 4|

Example POST call:

To set authorization header:

Encode `clientId:clientSecret` using base64urlencode.

Example `client1:secret1` becomes `Y2xpZW50MTpzZWNyZXQx`

`
curl --request POST 'https://oauth.bitbns.com/oauth/refresh' \
--header 'Authorization: Basic Y2xpZW50MTpzZWNyZXQx' \
--header 'Content-Type: application/json' \
--data-raw '{
    "refreshToken":"cf6941ae8918b6a008f1377f36a4557ab5935b36"
}
'
`

After a successful request, a valid access_token and refresh token will be returned in the response.

Here is an example response:

```javascript
{
   "refreshToken":{
      "token":"sFDMZM9KJIu4kzGRS4HaxNB3GZFJ4e5HdE8tSxOPORNZZleytNefpYj8NHsZLF7V6LX9ItWNQOwi3UJs9zhvOdy146kxFo40SmuK9DlorUaZcOjbZOYmX2Hd14h3Hxyv1M39dz7GyEOPnxDq5mnGbMFrGRQALQF00qFAMu6SNzEU9Hn0T7Pw6w1Vx64rYXokdFz99okCkXUdJZzEjJ759YUNw7RlfeltsRG8C1dRAs7JcS5HKg0EuIdxiPXpOioX",
      "expiresAt":1622056620946
   },
   "accessToken":{
      "token":"ZsMLsdEkHZ3Shdvw7CHwL0MuMfHjZX66VLYSVcyd0PZNdubG3lLAwtjjcb0usFWiPohSihL9XYU3oFqba4m67LNZFW21d91iwG9JrSgWfRaoPq304MLbpnADpwBo3ARB0uOyjdhGsb4PpCMFpCCR0IY5mAUFHCmZJpylXI6QKySm5H3uxejfXrZFTpqfsxxJWWtBhsq8E06f22lE04VVSAWLDZVPx908yr8W6PxO4vcZzpiNh1CPq2VCEtXH1pgQ",
      "expiresAt":1622050220946
   },
   "scope":"name email",
   "token_type": "Bearer"
}
````


## Tokens

- `Access Token` is used to allow an application to access an API.
- `Access Token` remains valid for an hour.
- `Refresh Token` is used to generate a new `Access Token` when the previous one has expired.
	- When generating a new `Access Token` using `Refresh Token`, a new `Refresh Token` is also returned back and the previous one is discarded.
- `Refresh Token` remains valid for 30 days.
- If both access token and refresh token gets expired, user will have to reauthorise the flow.

------
