var express = require('express');
var fetch = require('node-fetch');
var fs = require('fs');
var path = require('path');
var router = express.Router();

var clientUri = process.env.CLIENT_URI || 'http://127.0.0.1:4200';
var redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8888/callback';
var credentialsPath = path.join(__dirname, '..', 'client_secret.json');

if (!fs.existsSync(credentialsPath)) {
    throw new Error(
        'Missing client_secret.json. Copy client_secret.example.json to client_secret.json and add your Spotify credentials.'
    );
}

var credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8')).installed;
var clientId = credentials.client_id;
var clientSecret = credentials.client_secret;
var scopes = [
    'user-read-private',
    'user-read-email',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state'
].join(' ');

function tokenHeaders() {
    return {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    };
}

function saveSession(req) {
    return new Promise(function (resolve, reject) {
        req.session.save(function (error) {
            if (error) reject(error);
            else resolve();
        });
    });
}

async function refreshSessionToken(req) {
    if (!req.session || !req.session.refreshToken) {
        var error = new Error('No refresh token. Visit /login first.');
        error.status = 401;
        throw error;
    }

    var params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', req.session.refreshToken);

    var response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: tokenHeaders(),
        body: params
    });
    var data = await response.json();

    if (!response.ok) {
        var error = new Error(data.error_description || 'Token refresh failed');
        error.status = response.status;
        throw error;
    }

    req.session.accessToken = data.access_token;
    if (data.refresh_token) req.session.refreshToken = data.refresh_token;
    await saveSession(req);
    return data.access_token;
}

async function spotifyRequest(req, url, options) {
    var token = req.session.accessToken || await refreshSessionToken(req);
    var requestOptions = Object.assign({}, options || {});
    requestOptions.headers = Object.assign({}, requestOptions.headers || {}, {
        Authorization: 'Bearer ' + token
    });

    var response = await fetch(url, requestOptions);
    if (response.status === 401) {
        token = await refreshSessionToken(req);
        requestOptions.headers.Authorization = 'Bearer ' + token;
        response = await fetch(url, requestOptions);
    }

    if (response.status === 204) return null;

    var data = await response.json();
    if (!response.ok) {
        var message = data.error && data.error.message
            ? data.error.message
            : data.error_description || 'Spotify request failed';
        var error = new Error(message);
        error.status = response.status;
        throw error;
    }
    return data;
}

router.get('/login', function (req, res) {
    var authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    res.redirect(authUrl.toString());
});

router.get('/callback', async function (req, res, next) {
    try {
        if (req.query.error) {
            throw new Error('Spotify authorization was denied: ' + req.query.error);
        }
        if (!req.query.code) {
            var missingCodeError = new Error('Spotify did not return an authorization code.');
            missingCodeError.status = 400;
            throw missingCodeError;
        }

        var params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', req.query.code);
        params.append('redirect_uri', redirectUri);

        var response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: tokenHeaders(),
            body: params
        });
        var data = await response.json();

        if (!response.ok) {
            var authError = new Error(data.error_description || 'Authorization failed');
            authError.status = response.status;
            throw authError;
        }

        req.session.accessToken = data.access_token;
        req.session.refreshToken = data.refresh_token;
        await saveSession(req);
        res.redirect(clientUri);
    } catch (error) {
        next(error);
    }
});

function get(endpointBuilder) {
    return async function (req, res, next) {
        try {
            res.json(await spotifyRequest(req, endpointBuilder(req)));
        } catch (error) {
            next(error);
        }
    };
}

router.get('/me', get(function () {
    return 'https://api.spotify.com/v1/me';
}));
router.get('/search/:category/:resource', get(function (req) {
    return 'https://api.spotify.com/v1/search?q=' +
        encodeURIComponent(req.params.resource) +
        '&type=' + encodeURIComponent(req.params.category) +
        '&limit=10';
}));
router.get('/artist/:id', get(function (req) {
    return 'https://api.spotify.com/v1/artists/' + encodeURIComponent(req.params.id);
}));
router.get('/artist-albums/:id', get(function (req) {
    return 'https://api.spotify.com/v1/artists/' + encodeURIComponent(req.params.id) + '/albums?limit=10';
}));
router.get('/artist-top-tracks/:id', get(function (req) {
    return 'https://api.spotify.com/v1/artists/' + encodeURIComponent(req.params.id) + '/top-tracks?market=US';
}));
router.get('/album/:id', get(function (req) {
    return 'https://api.spotify.com/v1/albums/' + encodeURIComponent(req.params.id);
}));
router.get('/album-tracks/:id', get(function (req) {
    return 'https://api.spotify.com/v1/albums/' + encodeURIComponent(req.params.id) + '/tracks';
}));
router.get('/track/:id', get(function (req) {
    return 'https://api.spotify.com/v1/tracks/' + encodeURIComponent(req.params.id);
}));

router.get('/playback-token', async function (req, res, next) {
    try {
        var token = req.session.accessToken || await refreshSessionToken(req);
        res.json({ access_token: token });
    } catch (error) {
        next(error);
    }
});

router.put('/playback/transfer', async function (req, res, next) {
    try {
        if (!req.body.device_id) {
            return res.status(400).json({ error: 'device_id is required' });
        }
        await spotifyRequest(req, 'https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                device_ids: [req.body.device_id],
                play: false
            })
        });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

router.put('/playback/play', async function (req, res, next) {
    try {
        if (!req.body.device_id || !req.body.spotify_uri) {
            return res.status(400).json({
                error: 'device_id and spotify_uri are required'
            });
        }

        await spotifyRequest(
            req,
            'https://api.spotify.com/v1/me/player/play?device_id=' +
                encodeURIComponent(req.body.device_id),
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uris: [req.body.spotify_uri]
                })
            }
        );

        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
