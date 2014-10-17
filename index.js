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

		try {
			res = autoprefixer(fileOpts).process(file.contents.toString(), {
				map: file.sourceMap ? {annotation: false} : false,
				from: file.relative,
				to: file.relative
			});

			file.contents = new Buffer(res.css);

			if (res.map && file.sourceMap) {
				var resMap = JSON.parse(res.map.toString());
				var origMap = file.sourceMap;
				if (!origMap.sources) {
					origMap.sources = [];
				}
				origMap.sources.push(file.path);

				if (!origMap.sourcesContent) {
					origMap.sourcesContent = [];
				}
				var index = origMap.sources.length - 1;
				origMap.sourcesContent[index] = file.contents.toString();
				
				origMap.mappings += resMap.mappings;
			}
			
			cb(null, file);
		} catch (err) {
			cb(new gutil.PluginError('gulp-autoprefixer', err, {fileName: file.path}));
		}
	});
};
