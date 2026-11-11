--Readme document for *Timothy Tuan Nguyen*, *timotn14@uci.edu*--

1. How many assignment points do you believe you completed (replace the *'s with your numbers)?

11/10
- 1/1 Communicating with the webserver
- 1/1 Populating information about the user
- 3/3 Populating the search component
- 3/3 Artist page
- 1.5/1.5 Album page
- 0.5/0.5 Track page
- 1/0 Extra Credit: Multiple sessions/users + web player

2. How long, in hours, did it take you to complete this assignment?

Total: 21.5 hours.

Reading instructions and planning: 45 minutes.
Researching resources / tutorials for some features: 5 hours.
Programming and troubleshooting: 15 hours.
Preparing project for submission: 45 minutes.

3. What online resources did you consult when completing this assignment? (list specific URLs)

- Course lecture slides and Assignment 3 instructions and files on Canvas

- W3Schools: https://www.w3schools.com/
- TypeScript: https://www.typescriptlang.org/docs/
- Angular: https://angular.dev/

- Bootstrap Progress: https://getbootstrap.com/docs/5.3/components/progress/
- Bootstrap Carousel: https://getbootstrap.com/docs/5.3/components/carousel/
- Chroma.js: https://gka.github.io/chroma.js/

- Express Routing: https://expressjs.com/en/guide/routing.html
- Express CORS Middleware: https://expressjs.com/en/resources/middleware/cors/
- Express Session Middleware: https://github.com/expressjs/session

- Spotify Web API authorization: https://developer.spotify.com/documentation/web-api/concepts/authorization
- Spotify Authorization Code Flow: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
- Spotify Web Playback SDK: https://developer.spotify.com/documentation/web-playback-sdk/
- Spotify Web API scopes: https://developer.spotify.com/documentation/web-api/concepts/scopes

For Generative AI, I asked conceptual queries such as "How do I do [this]?", "Explain [this]", "Why is [this] not working?", "Why do I get this error, [error]?", and "Is this [output] reasonable?". I also asked Generative AI to walk me through how some tests I can do (like pressing certain buttons) to verify that I met the rubric requirements.

4. What classmates or other individuals did you consult as part of this assignment? What did you discuss?

I consulted with a few classmates about the estimated duration of how long it would take to complete this assignment, for those that started working on it before me.

5. Did you add a bonus feature to your submission? If so, what is it and how should we see it?

- Multiple users/sessions: The real webserver stores each user's access and refresh tokens in an express-session session instead of a shared tokens.json file. Test it by opening a second private browser window and log in. The video file "A3_EC_Multi-Sessions_Web -layback.mp4" shows this.

- Spotify Web Playback SDK: Plays Spotify tracks via the web playback SDK. Test it by opening any track, "Connect Player", and then "Play". The video file "A3_EC_Multi-Sessions_Web-Playback.mp4" shows this.

Spotify Premium and Spotify developer app are required.

6. Is there anything special we need to know in order to run your code?

Dummy Webserver (Required) Steps:
1) Download the "dummy_webserver" zip from Canvas and paste it in the root folder (or another folder, but we assume the root folder for these instructions).
2a) Client: "npm install".
2b) Client: "npm start".
3a) Webserver (dummy): "npm install".
3b) Webserver (dummy): "npm start".
4) Visit "http://localhost:4200/".
5) "Log in with Spotify" and complete the login progress if not already logged in.

Real Webserver (Extra Credit/Bonus) Steps:
0) Do not overwrite the "webserver" folder with the Canvas "webserver". I modified some of the files, so overwriting may prevent the webserver and bonus features from working properly.
1) In the Spotify Developer Dashboard, create an app (if one does not already exist).
1a) Add "http://127.0.0.1:8888/callback" as a redirect URI.
1b) Copy the Client ID and paste it into "webserver/client_secret.json" (create the file if it does not already exist by making a copy of "webserver/client_secret.example.json").
1c) Copy the Client Secret and paste it into "webserver/client_secret.json".
2a) Client: "npm install".
2b) Client: "npm start -- --host 127.0.0.1 --port 4200".
3a) Webserver (real): "for /f %i in ('node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"') do set SESSION_SECRET=%i".
3b) Webserver (real): "npm install".
3c) Webserver (real): "npm start".
4) Visit "http://localhost:4200/".
5) "Log in with Spotify" and complete the login progress if not already logged in.
6a) Test the multiple session extra credit by opening a second private browser window and repeat Steps 4-5.
6b) Test the web player extra credit by looking up any track, "Connect Player", and then "Play".