const sync = require('synchronize');
const request = require('request');
const _ = require('underscore');


// The API that returns the in-email representation.
module.exports = function(req, res) {
  var term = req.query.text.trim();
  if (/^http:\/\/trailapi\.placeholder\/\S+/.test(term)) {
    // Special-case: handle strings in the special URL form that are suggested by the /typeahead
    // API. This is how the command hint menu suggests an exact Giphy image.
    handleString(term.replace(/^http:\/\/trailapi\.placeholder\//, ''), req, res);
  } else {
    // failed
    return;
  }
};

function generateStaticMap(lat, lon){
  // generates a static map for the header html when generated
  return `<img src='https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=13&size=500x300&maptype=roadmap&key= ${process.env.GOOGLE_MAPS_KEY}'>`
}

function handleString(term, req, res) {

  let terms = term.split(":");
  let response;


  let options = {
    method:"GET",
    url: 'https://trailapi-trailapi.p.mashape.com',
    headers:{
      "X-Mashape-Key" : process.env.MASHAPE_KEY,
      "Accept": "text/plain"
    },
    qs: {
      "lat": terms[0],
      "lon":terms[1],
      "radius":"2", // we want to hack our way to get this location again
      limit:5
    },
    gzip: true,
    json: true,
    timeout: 10 * 1000
  }

  try {
    response = sync.await(request(options, sync.defer()));
  } catch (e) {
    res.status(500).send('Error');
    return;
  }
  let place = response.body.places[0];
  let html = `<div style='max-width:500px;font-family:"Roboto","Helvetica Neue","Trebuchet MS","Segoe",Helvetica,Arial,sans-serif;border: 1px solid #d8d8d8;box-sizing: border-box;border-radius: 0px 0px 5px 5px;'><div id='t-map'>${generateStaticMap(place.lat, place.lon)}</div><div style='border-radius:0px 0px 5px 5px;'><div style="border-bottom: 1px solid #d8d8d8;padding:15px;"><div style='font-weight:600;font-size:120%;'>${place.name}</div><div style='color:grey'>${place.city}, ${(place.state || place.country)}</div></div><div style='font-size:90%;padding:15px;line-height:2;'>${place.description||place.activities[0].description||place.directions}<a target='_blank' href='https://www.google.com/maps/dir//${place.lat},${place.lon}' style='display:block;color:#fff;line-height: 38px;height: 38px;text-align:center;width: 100px;text-decoration: none;border: 0px;border-radius: 2px;margin: 15px 0px 10px;box-shadow: 1px 1px 1px rgba(0,0,0,0);background-color: #3c7de6;'>Let's Go!</a></div></div></div>`;
  res.json({
    body: html
    // Add raw:true if you're returning content that you want the user to be able to edit
  });
}
