var express = require('express');
var im = require('imagemagick');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var app = express();
var config = require('./config');
var upload = path.resolve(__dirname, config.upload);

var utils = {
	getMaxRandom: function(str, max) {
		var lists = str.split(""),
		ret = [],
		total = lists.length;
		for (var i = 0; i < max; i++) {
			ret.push(lists[Math.floor(Math.random() * total)]);
		}
		return ret.join('');
	},
	getFileName: function(pic) {
		var unique = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		var base64 = crypto.createHash('md5');
		var name = new Date().valueOf() + pic.name + unique;
		base64.update(name);
		return this.getMaxRandom(base64.digest("hex"), 15);
	},
	allowUpload: function(type) {
		if (type === 'gif' || type === 'jpg' || type === 'jpeg' || type === 'png') return true;
		return false;
	}
};

app.use(express['static'](upload));
app.use(express.bodyParser({
	keepExtensions: true,
	uploadDir: upload
}));

app.post('/upload', function(req, res) {
	var pic = req.files.pic;
	if (pic) {
		var name = utils.getFileName(pic);
		var target = path.resolve(upload, name);
		im.identify(pic.path, function(err, output) {
			var type = output.format.toLowerCase();
			if (utils.allowUpload(type)) {
				var width = output.width,
				height = output.height;
				target = target + '.' + type;
				fs.renameSync(pic.path, target);
				if (width <= config.maxWidth && height <= config.maxWidth) {
					res.send('ok');
				} else {
					var resize = {
						srcPath: target,
						dstPath: target
					};
					if (width >= height) {
						resize.width = config.maxWidth;
						im.resize(resize, function() {
							res.send('ok');
						});
					} else {
						resize.height = config.maxHeight;
						im.resize(resize, function() {
							res.send('ok');
						});
					}
				}
			} else {
				fs.unlinkSync(pic.path);
				res.send(500);
			}
		});
	} else {
		res.send(500);
	}
});

app.listen(config.port);
console.log('app listen ' + config.port);

