'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var autoprefixer = require('autoprefixer-core');
var applySourceMap = require('vinyl-sourcemaps-apply');
var objectAssign = require('object-assign');

module.exports = function (opts) {
	opts = opts || {};

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-autoprefixer', 'Streaming not supported'));
			return;
		}

		var res;
		var fileOpts = objectAssign({}, opts);
		var map = false;
		 

		try {
			if (fileOpts.map) {
				map = fileOpts.map
			} else {
				map = file.sourceMap ? {annotation: false} : false
			}
			res = autoprefixer(fileOpts).process(file.contents.toString(), {
				map: map,
				from: file.relative,
				to: file.relative
			});

			file.contents = new Buffer(res.css);

			if (res.map && file.sourceMap) {
				applySourceMap(file, res.map.toString());
			}

			cb(null, file);
		} catch (err) {
			cb(new gutil.PluginError('gulp-autoprefixer', err, {fileName: file.path}));
		}
	});
};
