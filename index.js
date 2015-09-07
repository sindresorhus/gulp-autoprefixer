'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var applySourceMap = require('vinyl-sourcemaps-apply');
var autoprefixer = require('autoprefixer');
var postcss = require('postcss');

module.exports = function (opts) {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-autoprefixer', 'Streaming not supported'));
			return;
		}

		var processor = postcss()
			.use(autoprefixer(opts))
			.process(file.contents.toString(), {
				map: file.sourceMap ? {annotation: false, prev: JSON.stringify(file.sourceMap)} : false,
				from: file.path,
				to: file.path
			});

		processor.then(function (res) {
			file.contents = new Buffer(res.css);

			if (res.map && file.sourceMap) {
				var originalFile = file.sourceMap.file;
				var originalSources = file.sourceMap.sources;
				applySourceMap(file, res.map.toString());
				file.sourceMap.file = originalFile;
				file.sourceMap.sources = originalSources;
			}

			var warnings = res.warnings();

			if (warnings.length > 0) {
				gutil.log('gulp-autoprefixer:', '\n  ' + warnings.join('\n  '));
			}

			cb(null, file);
		}).catch(function (err) {
			var cssError = err.name === 'CssSyntaxError';

			if (cssError) {
				err.message += err.showSourceCode();
			}

			// prevent stream unhandled exception from being suppressed by Promise
			setImmediate(cb, new gutil.PluginError('gulp-autoprefixer', err, {
				fileName: file.path,
				showStack: !cssError
			}));
		});
	});
};
