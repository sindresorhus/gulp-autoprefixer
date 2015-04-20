'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var autoprefixer = require('autoprefixer-core');
var applySourceMap = require('vinyl-sourcemaps-apply');
var objectAssign = require('object-assign');
var postcss = require('postcss');
var CssSyntaxError = require('postcss/lib/css-syntax-error');

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

		try {
			var fileOpts = objectAssign({}, opts);
			var processor = postcss()
				.use(autoprefixer(fileOpts))
				.process(file.contents.toString(), {
					map: file.sourceMap ? {annotation: false} : false,
					from: file.path,
					to: file.path
				});

			processor.then(function (res) {
				file.contents = new Buffer(res.css);

				if (res.map && file.sourceMap) {
					applySourceMap(file, res.map.toString());
				}

				if (res.warnings && res.warnings()) {
					res.warnings().forEach(function (warn) {
						gutil.log(warn.toString());
					});
				}

				cb(null, file);
			});
		} catch (err) {
			var cssError = err instanceof CssSyntaxError;

			if (cssError) {
				err.message = err.message + err.showSourceCode();
			}

			cb(new gutil.PluginError('gulp-autoprefixer', err, {
				fileName: file.path,
				showStack: !cssError
			}));
		}
	});
};
