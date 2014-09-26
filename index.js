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
		var mapOpts = {annotation: false};

		try {
			if (file.sourceMap && file.sourceMap.mappings !== '') {
				mapOpts = objectAssign(mapOpts, {prev: file.sourceMap});
			}

			res = autoprefixer(fileOpts).process(file.contents.toString(), {
				map: file.sourceMap ? mapOpts : false,
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
