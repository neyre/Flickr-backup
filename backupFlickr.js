// Flickr Collections Backup Script
// Nick Eyre, 2014
// nickeyre1@gmail.com

var FlickrAPI= require('flickrnode').FlickrAPI;
var sys= require('sys');
var fs = require('fs');
var request = require('request');

// Configuration
var flickr= new FlickrAPI(api_key,shared_secret,authentication_token);

// Empty Download Queue
var photoList = [];

// Get Tree of Collections
flickr.collections.getTree({}, function(error,results){

	// For Each Collection
	results.collection.forEach(function(element,index,array){

		// For Each Set
		if(element.set != undefined){
			element.set.forEach(function(element2,index2,array2){

				// For Each Photo in Set
				flickr.photosets.getPhotos({'photoset_id':element2.id, 'extras':'tags,url_o'}, function(er,re){
					re.photo.forEach(function(element3,index3,array3){

						// Add Each Photo to Download Queue
						var index = (index3+1);
						photoList.push({url: element3['url_o'], index: index, year: element.title, album: element2.title});
					});
				});
			});
		}
	});
});

// Start 3 Downloaders
downloadNext();
downloadNext();
downloadNext();

// Grab an Image from List & Download It
function downloadNext(){
	if(photoList.length){
		var element = photoList.pop();
		console.log(element);
		fs.mkdir(element.year, function(er1){
			fs.mkdir(element.year+'/'+element.album, function(er2){
				var name = element.year+'/'+element.album+'/'+element.index+'.jpg';
				var r = request(element.url).pipe(fs.createWriteStream(name));
				r.on('error', function(error){
					photoList.push(element);
					downloadNext();
					return;
				});
				r.on('finish', function(resp){
					downloadNext();
					console.log(photoList.length);
					return;
				});
			});
		});
	}else{
		setTimeout(downloadNext, 100);
		return;
	}
}