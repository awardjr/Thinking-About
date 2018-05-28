const http = require('http');
const twitter = require('twitter');
const fs = require('fs');

require('dotenv').config()

const hostname = process.env.SERVER_HOSTNAME;
const port = process.env.SERVER_PORT;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  var client = twitter_auth();

  var username = process.env.TWITTER_USERNAME;
  var query = `from:` + username + `"thinking about" -RT`;
  var params = {
    q: query
  };
  var date = new Date();
  var exists = false;
  var recent = false;


  let filePromise = new Promise(function (resolve, reject) {

    if (fs.existsSync(process.env.CACHE_FILENAME)) {
      var exists = true;
    }

    if (exists && date - Date(fs.statSync(process.env.CACHE_FILENAME).mtime) < process.env.RECENT_THRESHOLD) {
      var recent = true;
    }

    if (!exists || !recent) {
      client.get('search/tweets', params, function (errors, tweets, response) {
        var tweet = process.env.DEFAULT_TEXT;
        if (!errors) {
          if (tweets.statuses.length > 0) {
            tweet = tweets.statuses[0].text;
            fs.writeFile(process.env.CACHE_FILENAME, tweet, 'utf8', function (error) {
              if (error) {
                console.log(error);
              } else {
                resolve(true);
              }
            });
          } else if(!exists) { 
            //Can't find any existing or new so we'll create the file with default text
            fs.writeFile(process.env.CACHE_FILENAME, process.env.DEFAULT_TEXT, 'utf8', function (error) {
              if (error) {
                console.log(error);
              } else{
                resolve(true);
              }
            });
          } else {
            resolve(true);
          }
        }
      });
    }  else {
      resolve(true);
    }
  });

  filePromise.then((message) => {
    fs.readFile(process.env.CACHE_FILENAME, 'utf8', function (error, data) {
      if (!error) {
        html = `<html><body style='background: #333333; overflow: hidden;'><div style='position: absolute; display: table; width: 100%; height: 100%;'><h1 style='font-size: 64px; text-align: center; vertical-align: middle; display: table-cell; font-family: sans-serif; color:#777777; margin:auto;'>` + data + `</h1></div></body></html>`
        res.end(html);
      } else {
        console.log(error);
      }
    });
  });



});
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


function twitter_auth() {
  var client = new twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

  return client;
}