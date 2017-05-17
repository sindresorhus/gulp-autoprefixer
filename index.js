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

				//applySourceMap(file, res.map.toString());
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
