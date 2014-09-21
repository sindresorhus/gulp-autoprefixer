'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var sourceMaps = require('gulp-sourcemaps');
var autoprefixer = require('./');

it('should autoprefix CSS', function (cb) {
	var stream = autoprefixer();

	stream.on('data', function (file) {
		assert(/-/.test(file.contents.toString()));
		assert.equal(file.relative, 'fixture.css');
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		cwd: __dirname,
		base: __dirname + '/fixture',
		path: __dirname + '/fixture/fixture.css',
		contents: new Buffer('a {\n\tdisplay: flex;\n}')
	}));

	stream.end();
});

it('should generate source maps', function (cb) {
	var init = sourceMaps.init();
	var write = sourceMaps.write();

	init
		.pipe(autoprefixer())
		.pipe(write);

	write.on('data', function (file) {
		assert.equal(file.sourceMap.mappings, 'AAAA;CACC,uBAAc;CAAd,sBAAc;CAAd,eAAc;EACd');
		var contents = file.contents.toString();
		assert(/flex/.test(contents));
		assert(/sourceMappingURL=data:application\/json;base64/.test(contents));
		cb();
	});

	init.write(new gutil.File({
		cwd: __dirname,
		base: __dirname + '/fixture',
		path: __dirname + '/fixture/fixture.css',
		contents: new Buffer('a {\n\tdisplay: flex;\n}'),
		sourceMap: ''
	}));

	init.end();
});
