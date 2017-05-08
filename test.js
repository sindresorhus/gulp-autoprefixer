/* eslint-env mocha */
'use strict';
const path = require('path');
const assert = require('assert');
const gutil = require('gulp-util');
const sourceMaps = require('gulp-sourcemaps');
const autoprefixer = require('./');

it('should autoprefix CSS', cb => {
	const stream = autoprefixer();

	stream.on('data', file => {
		assert(/-/.test(file.contents.toString()));
		assert.equal(file.relative, 'fixture.css');
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture', 'fixture.css'),
		contents: Buffer.from('a {\n\tdisplay: flex;\n}')
	}));

	stream.end();
});

it('should generate source maps', cb => {
	const init = sourceMaps.init();
	const write = sourceMaps.write();

	init
		.pipe(autoprefixer({
			browsers: ['Firefox ESR']
		}))
		.pipe(write);

	write.on('data', file => {
		assert.equal(file.sourceMap.mappings, 'AAAA;CACC,cAAc;CACd');
		const contents = file.contents.toString();
		assert(/flex/.test(contents));
		assert(/sourceMappingURL=data:application\/json;charset=utf8;base64/.test(contents));
		cb();
	});

	init.write(new gutil.File({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture', 'fixture.css'),
		contents: Buffer.from('a {\n\tdisplay: flex;\n}'),
		sourceMap: ''
	}));

	init.end();
});

it('should read upstream source maps', cb => {
	let testFile;
	const stream = autoprefixer();
	const write = sourceMaps.write();
	const sourcesContent = [
		'a {\n  display: flex;\n}\n',
		'a {\n\tdisplay: flex;\n}\n'
	];

	stream.pipe(write);

	write.on('data', file => {
		assert.equal(file.sourceMap.sourcesContent[0], sourcesContent[0]);
		assert.equal(file.sourceMap.sourcesContent[1], sourcesContent[1]);
		cb();
	});

	stream.write(
		testFile = new gutil.File({
			cwd: __dirname,
			base: path.join(__dirname, 'fixture'),
			path: path.join(__dirname, 'fixture', 'fixture.css'),
			contents: Buffer.from('a {\n\tdisplay: flex;\n}\n')
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
