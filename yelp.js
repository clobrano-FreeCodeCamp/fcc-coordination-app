'use strict';
const yelp = require('yelp-fusion');
const NodeCache = require ('node-cache');

const clientId = process.env.YELP_ID
const clientSecret = process.env.YELP_SECRET
const cache = new NodeCache();

module.exports.get_places = function (location, callback) {
  const cached = cache.get (location);

  if (cached)
    return callback (null, cached);

  yelp.accessToken(clientId, clientSecret).then(response => {
    const client = yelp.client(response.jsonBody.access_token);

    client.search({
      term:'restaurant pizza',
      location: location
    }).then(response => {
      const places = response.jsonBody.businesses;
      cache.set (location, places);
      callback (null, places);
    });
  }).catch(e => {
    console.log(e);
    callback(e, null);
  });
}
