'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var autoprefixer = require('autoprefixer-core');
var applySourceMap = require('vinyl-sourcemaps-apply');
var objectAssign = require('object-assign');

module.exports = function (opts) {
	opts = opts || {};
	// Backwards compatibility with older versions.
	if (typeof opts === "string") {
		opts = { browsers: [].slice.call(arguments) };
	}

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
				applySourceMap(file, res.map.toString());
			}

			cb(null, file);
		} catch (err) {
			cb(new gutil.PluginError('gulp-autoprefixer', err, {fileName: file.path}));
		}
	});
};
