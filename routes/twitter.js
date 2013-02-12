var request = require('request')
, config = require('../config')
, Twit = require('twit')
, async = require('async');

var twit = new Twit(config.twitConfig);

// return a bound function with socket
exports.getTweet = function(res, count) {
  return function(err, reply) {
    if (err) {
      console.log(err);
      return;
    }
    var results = [];

    for(var i = 0; i < reply.statuses.length; i++) {
      var tweet = reply.statuses[i];
      var t = {};
      var text_splits = tweet.text.split(/\s/);
      var vine_url = text_splits[text_splits.length - 1];
      t.user = tweet.user.screen_name;
      t.id = tweet.id_str;
      t.text = tweet.text;
      t.vine_url = vine_url;
      t.vid_url = '';
      request( vine_url, function(error, response, body) {
        var pattern = /https\:\/\/vines\.s3\.amazonaws.com\/videos\/.*?\.mp4/;
        var match = pattern.exec(body);
        if(match != null && !error && response.statusCode == 200) {
          this.t.vid_url = match[0];
          aggregate(this.t);
        }
        // note and and keep track of failure 
        else {
          console.log('\nfailed to load tweet : ' + this.text + '\n');
        }
      }.bind({t:t}));
    }
    // this error handling no longer works for the REST style API
    // if ( failures > 0 ) {
    //   twit.get('search/tweets', {
    //     q: global.last_query.track + ' source:vine_for_ios exclude:retweets',
    //     result_type: global.last_query.result_type,
    //     count: failures,
    //     max_id: global.last_twitter_id
    //   }, getTweet(this.res));
    // }

    // this function aggregates all the results and sends when the right amount of stuff is aggregated
    // I can see why Node.JS isn't for everything
    function aggregate(t) {
      results.push(t);
      if (results.length == count) {
        res.json(results);
      }
    } 
  }.bind( {res: res, count: count} )
}