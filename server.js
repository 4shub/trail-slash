const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const sync = require('synchronize');
const cors = require('cors');
const dotenv = require('dotenv').load();

// Use fibers in all routes so we can use sync.await() to make async code easier to work with.
app.use(function(req, res, next) {
  sync.fiber(next);
});

// Since Mixmax calls this API directly from the client-side, it must be whitelisted.
var corsOptions = {
  origin: /^[^.\s]+\.mixmax\.com$/,
  credentials: true
};


app.get('/typeahead', cors(corsOptions), require('./api/typeahead'));
app.get('/resolver', cors(corsOptions), require('./api/resolver'));

app.listen(process.env.PORT || 9145);
