import {Buffer} from 'node:buffer';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'ava';
import Vinyl from 'vinyl';
import sourceMaps from 'gulp-sourcemaps';
import {pEvent} from 'p-event';
import autoprefixer from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('autoprefix CSS', async t => {
	const stream = autoprefixer();
	const data = pEvent(stream, 'data');

	stream.end(new Vinyl({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture', 'fixture.css'),
		contents: Buffer.from('::placeholder {\n\tcolor: gray;\n}'),
	}));

	const file = await data;
	t.regex(file.contents.toString(), /-/);
	t.is(file.relative, 'fixture.css');
});

test('generate source maps', async t => {
	const init = sourceMaps.init();
	const write = sourceMaps.write();
	const data = pEvent(write, 'data');

	init
		.pipe(autoprefixer({
			overrideBrowserslist: ['Firefox ESR'],
		}))
		.pipe(write);

	init.end(new Vinyl({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture', 'fixture.css'),
		contents: Buffer.from('a {\n\tdisplay: flex;\n}'),
		sourceMap: '',
	}));

	const file = await data;
	t.is(file.sourceMap.mappings, 'AAAA;CACC,aAAa;AACd');
	const contents = file.contents.toString();
	t.regex(contents, /flex/);
	t.regex(contents, /sourceMappingURL=data:application\/json;charset=utf8;base64/);
});

test('read upstream source maps', async t => {
	const stream = autoprefixer();
	const finalStream = stream.pipe(sourceMaps.write());
	const data = pEvent(finalStream, 'data');

	const testFile = new Vinyl({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture', 'fixture.css'),
		contents: Buffer.from('a {\n\tdisplay: flex;\n}\n'),
	});

	testFile.sourceMap = {
		version: 3,
		sources: ['imported.less'],
		names: [],
		mappings: 'AAAA;EACC,aAAA',
		file: 'fixture.css',
		sourcesContent: ['a {\n  display: flex;\n}\n'],
	};

	stream.end(testFile);

	const file = await data;

	const sourcesContent = [
		'a {\n  display: flex;\n}\n',
		'a {\n\tdisplay: flex;\n}\n',
	];

	t.is(file.sourceMap.sourcesContent[0], sourcesContent[0]);
	t.is(file.sourceMap.sourcesContent[1], sourcesContent[1]);
});
