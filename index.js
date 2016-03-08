'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var applySourceMap = require('vinyl-sourcemaps-apply');
var autoprefixer = require('autoprefixer');
var postcss = require('postcss');
var path = require('path');

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

		postcss(autoprefixer(opts)).process(file.contents.toString(), {
			map: file.sourceMap ? {annotation: false} : false,
			from: file.path,
			to: file.path
		}).then(function (res) {
			var map;
			file.contents = new Buffer(res.css);

			if (res.map && file.sourceMap) {
				map = res.map.toJSON();
				map.file = file.relative;
				map.sources = [].map.call(map.sources, function (source) {
					return path.join(path.dirname(file.relative), source);
				});
				applySourceMap(file, map);
			}

			var warnings = res.warnings();

			if (warnings.length > 0) {
				gutil.log('gulp-autoprefixer:', '\n  ' + warnings.join('\n  '));
			}

			setImmediate(cb, null, file);
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
