/* eslint-env mocha */
'use strict';
var path = require('path');
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
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture', 'fixture.css'),
		contents: new Buffer('a {\n\tdisplay: flex;\n}')
	}));

	stream.end();
});

it('should generate source maps', function (cb) {
	var init = sourceMaps.init();
	var write = sourceMaps.write();

	init
		.pipe(autoprefixer({
			browsers: ['Firefox ESR']
		}))
		.pipe(write);

	write.on('data', function (file) {
		assert.equal(file.sourceMap.mappings, 'AAAA;CACC,cAAc;CACd');
		var contents = file.contents.toString();
		assert(/flex/.test(contents));
		assert(/sourceMappingURL=data:application\/json;base64/.test(contents));
		cb();
	});

	init.write(new gutil.File({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture', 'fixture.css'),
		contents: new Buffer('a {\n\tdisplay: flex;\n}'),
		sourceMap: ''
	}));

	init.end();
});

it('should read upstream source maps', function (cb) {
	var testFile;
	var stream = autoprefixer();
	var write = sourceMaps.write();
	var sourcesContent = [
		'a {\n  display: flex;\n}\n',
		'a {\n\tdisplay: flex;\n}\n'
	];

	stream.pipe(write);

	write.on('data', function (file) {
		assert.equal(file.sourceMap.sourcesContent[0], sourcesContent[0]);
		assert.equal(file.sourceMap.sourcesContent[1], sourcesContent[1]);
		cb();
	});

	stream.write(
		testFile = new gutil.File({
			cwd: __dirname,
			base: path.join(__dirname, 'fixture'),
			path: path.join(__dirname, 'fixture', 'fixture.css'),
			contents: new Buffer('a {\n\tdisplay: flex;\n}\n')
		}),
		testFile.sourceMap = {
			version: 3,
			sources: ['imported.less'],
			names: [],
			mappings: 'AAAA;EACC,aAAA',
			file: 'fixture.css',
			sourcesContent: ['a {\n  display: flex;\n}\n']
		}
	);

	stream.end();
});
