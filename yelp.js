'use strict';

const yelp = require('yelp-fusion');

const clientId = process.env.YELP_ID
const clientSecret = process.env.YELP_SECRET

module.exports.get_places = function (location, callback) {
  yelp.accessToken(clientId, clientSecret).then(response => {
    const client = yelp.client(response.jsonBody.access_token);

    client.search({
      term:'restaurant pizza',
      location: location
    }).then(response => {
      callback (null, response.jsonBody.businesses);
    });
  }).catch(e => {
    console.log(e);
    callback(e, null);
  });
}
