var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var trimjs = require('trim');
var perfy = require('perfy');
var moment = require('moment');
var re = require('request-enhanced');
var _ = require('underscore');

//var app = express();

var presentDayLink = 'http://www.billboard.com/charts/hot-100'
var startingLink = 'http://www.billboard.com/charts/hot-100/1958-08-09';
//var startingLink = 'http://www.billboard.com/charts/hot-100/2015-11-21';
var count = 0;
var countMax = 1000; //3000-14;
var out = {};

function getYYYY_MM_DD(moment) {
	return moment.format('YYYY-MM-DD');
}

function sortDates(a, b) {
  if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}


function saveToFile(saveMe, name) {
	var keys = Object.keys(saveMe);
	
	keys.sort(sortDates);
	fs.writeFile(name, JSON.stringify(keys.map(function(key) { return saveMe[key]; }), null, 4), function(err){
		console.log('File successfully written!');
	})
}

/**process.on('uncaughtException', function(err) {
	// handle the error safely
	console.log('fuck' + err)
})*/

var whatAmI = 0;
function runMe(dateString, output) {
  var url = 'http://www.billboard.com/charts/hot-100/' + dateString;
	
	re.get(url, function(error, html) {
		console.log('url ' + url);
		console.log('html' + !!html)
		if (error) { console.error(error); }
		
		var $
		try {
			$ = cheerio.load(html);
		}
		catch (error) {
		  console.log(html);
			console.log('shit' + error);
		}
			
		$(".chart-row .row-primary").each(function() {
			var row = $(this);
				
			var song_title = trimjs(row.find('.row-title h2').text());
			var artist = trimjs(row.find('.row-title h3').text());
			var thisRank = trimjs(row.find('.row-rank .this-week').text());
			
			if (true) {
				if (output[artist]) {
					var song = _.find(output[artist].songs, function(song) { return song.song_name === song_title; });
					if (song) {
						song.hit_details.push({url: url, rank: thisRank});
						//console.log('adding song');
						//output[artist].songs.push(song_title);
					}
					else {
						output[artist].songs.push({
							song_name: song_title,
							hit_details: [
								{
									url: url,
									rank: thisRank
								}									
							]
						});
					}
				}
				else {
					console.log('adding artist');
					output[artist] = {
						artist_name: artist,
						songs: [
							{
								song_name: song_title,
								hit_details: [
									{
										url: url,
										rank: thisRank
									}
								]
							}
						]
					};
				}
			}
			else {
				return {
					song_title: song_title,
					artist: artist,
					thisRank: thisRank
				};
			}
		}); //.get();
		console.log('boom! #' + whatAmI + ' ' + url);
		
		if (whatAmI++ === countMax) {
		  console.log('we are done!');
			saveToFile(output, 'output.json');
			console.log(perfy.end('timer').summary);
		}
	});
}

perfy.start('timer');

if (false) {
	var date = moment('1958-08-09');
	while (count++ <= countMax) {
		var dateString = getYYYY_MM_DD(date)
		runMe(dateString, out);
		date.add(7, 'days');
		console.log(count);
	}
}
else {
	function readMe(err, data) {
    if (err) {
		  throw err; // we'll not consider error handling for now
		}
    var obj = JSON.parse(data);
		Object.keys(obj).each(function(artist_rec) {
			console.log("artist: " + artist_rec.artist_name + " count:" + artist_rec.songs.length);
		});
	}
	
	function readMe2(err, resolvedPath) {
		if (err) {
			throw err;
		}
		//console.log(resolvedPath);
		var obj = JSON.parse(resolvedPath);
		
		//console.log(obj.);
		var ar = [];
		_.each(obj, function(artist_rec) {
		//	console.log(artist_rec);
		  ar.push({
				count: artist_rec.songs.length,
				artist: artist_rec.artist_name
			});
		});
		ar = ar.sort(function(a, b) { return b.count - a.count; });
		saveToFile(ar, 'output_sum.json');
	}

	//fs.readFile('output.json', 'utf8', readMe);
	fs.readFile('output.json', readMe2);
}