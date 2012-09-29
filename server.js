// Utilities.
var util = require("util");
var url = require("url");
var _ = require("underscore");
var eyes = require("eyes");

var inspect = require('eyes').inspector({
	stream: null
});

// Config.
var config = require("config");

// Express.js
var express = require("express");
var app = express();

app.use(express.bodyParser());
app.use(app.router);

// Request.
var request = require("request");

function venues(lat, lon, next) {
	// https://api.foursquare.com/v2/venues/search?ll=40.7,-74&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&v=YYYYMMDD
	var now = new Date();

	var endpoint = url.format(
	{
		protocol: "https",
		hostname: "api.foursquare.com",
		pathname: "/v2/venues/search",
		query: {
			ll: util.format("%d,%d", lat, lon),
			client_id: config.foursquare.clientId,
			client_secret: config.foursquare.clientSecret,
			v: "20120929" // now.toString("yyyyMMdd")
		}
	});

	console.log(endpoint);

	request(endpoint, function(error, response, body) {
		var errorMessage;

		console.log(util.format("error: %s", typeof error));
		console.log(util.format("response: %s", typeof response));
		console.log(util.format("body: %s", typeof body));

		if (error) {
			errorMessage = "Failed with error.";

		} else if (response.statusCode != 200) {
			errorMessage = util.format("Failed: %d.", response.statusCode);

		} else if (!body) {
			errorMessage = "Failed: missing body or body.meta.";
		
		}

		if (errorMessage) {
			next({
				message: errorMessage,
				error: error,
				response: response,
				body: body
			});

		} else {
			var json = JSON.parse(body);

			next(null, json.response);
		}
	});
}

// App.
app.get("/", function(req, res) {
	res.set({
		"content-type": "application/json"
	});

	venues(53.4850354, -2.2358191, function(error, response) {
		if (error) {
			console.log(error.message);

			res.send({
				message: "Error"
			});

		} else {
			// console.log(inspect(response));

			var venues = [];

			_.each(response.venues, function(venue) {
				venues.push(venue);
			});

			res.send({
				venueCount: venues.length,
				venues: venues
			});
		}
	});	
});

// Start app.
var port = process.env.port || 3000;

app.listen(port);

// Started.
console.log(util.format("--> started on port %d.", port));
console.log(inspect(config));
