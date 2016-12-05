const sync = require('synchronize');
const request = require('request');
const _ = require('underscore');
const activities = [
  "hiking",
  "camping",
  "caving"
]

// The Type Ahead API.
module.exports = function(req, res) {
  const code = process.env.MASHAPE_KEY;

  let terms = (req.query.text.trim() || "").split(" ");
      terms[0] = terms[0].toLowerCase();

  if (!terms[0] && !terms[1]) {
    res.json([{
      title: `<i>[activity] [city]</i>`,
      text: ''
    }]);
    return;
  } else if(terms[0] && !terms[1]){
    // return the activity if valid
    if(activities.indexOf(terms[0]) !== -1){

      res.json([{
        title: `<i>${terms[0]} [city]</i>`,
        text: ''
      }]);
      return;
    } else {
      res.json([{
        title: `<i>Activities supported: ${activities.join(", ")}</i>`,
        text: ''
      }]);
      return;
    }
  }


  // city names can have spaces in them so we need to join the array
  terms[1] = terms.slice(1).join(' ');


  let options = {
    method:"GET",
    url: 'https://trailapi-trailapi.p.mashape.com',
    headers:{
      "X-Mashape-Key" : process.env.MASHAPE_KEY,
      "Accept": "text/plain"
    },
    qs: {
      "q[activities_activity_type_name_eq]": terms[0],
      "q[city_cont]":terms[1],
      limit:5
    },
    gzip: true,
    json: true,
    timeout: 10 * 1000
  }

  let response;
  try {
    response = sync.await(request(options, sync.defer()));
  } catch (e) {

    res.status(500).send('Error');
    return;
  }

  if (response.statusCode !== 200 || !response.body || !response.body.places) {
    res.status(500).send('Error');
    return;
  }

  var results = _.chain(response.body.places)
    .reject(function(place) {
      return !place || !place.name || !place.city || !place.lat || !place.lon;
    })
    .map(function(place) {

      return {
        title: `<span style='font-weight:600'>${place.name}</span><br><span style='font-size:10px;color:grey'><span style='font-weight:600'>${place.city}, ${(place.state || place.country)}</span>: ${(place.description || place.activities[0].description || place.directions)}</span>`,
        text: `http://trailapi.placeholder/${place.lat}:${place.lon}`
      };
    })
    .value();

  if (results.length === 0) {
    res.json([{
      title: '<i>(no results)</i>',
      text: ''
    }]);
  } else {
    res.json(results);
  }
};
