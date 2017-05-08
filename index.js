'use strict';
const gutil = require('gulp-util');
const through = require('through2');
const applySourceMap = require('vinyl-sourcemaps-apply');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');

module.exports = opts => {
	return through.obj((file, enc, cb) => {
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
		}).then(res => {
			file.contents = Buffer.from(res.css);

			if (res.map && file.sourceMap) {
				applySourceMap(file, res.map.toString());
			}

			const warnings = res.warnings();

			if (warnings.length > 0) {
				gutil.log('gulp-autoprefixer:', '\n  ' + warnings.join('\n  '));
			}

			setImmediate(cb, null, file);
		}).catch(err => {
			const cssError = err.name === 'CssSyntaxError';

			if (cssError) {
				err.message += err.showSourceCode();
			}

			// Prevent stream unhandled exception from being suppressed by Promise
			setImmediate(cb, new gutil.PluginError('gulp-autoprefixer', err, {
				fileName: file.path,
				showStack: !cssError
			}));
		});
	});
};
