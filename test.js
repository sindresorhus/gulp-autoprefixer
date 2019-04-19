import path from 'path';
import test from 'ava';
import Vinyl from 'vinyl';
import sourceMaps from 'gulp-sourcemaps';
import pEvent from 'p-event';
import autoprefixer from '.';

test('autoprefix CSS', async t => {
	const stream = autoprefixer();
	const data = pEvent(stream, 'data');

	stream.end(new Vinyl({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture', 'fixture.css'),
		contents: Buffer.from('::placeholder {\n\tcolor: gray;\n}')
	}));

	const file = await data;
	t.true(/-/.test(file.contents.toString()));
	t.is(file.relative, 'fixture.css');
});

test('generate source maps', async t => {
	const init = sourceMaps.init();
	const write = sourceMaps.write();
	const data = pEvent(write, 'data');

	init
		.pipe(autoprefixer({
			browsers: ['Firefox ESR']
		}))
		.pipe(write);

	init.end(new Vinyl({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture', 'fixture.css'),
		contents: Buffer.from('a {\n\tdisplay: flex;\n}'),
		sourceMap: ''
	}));

	const file = await data;
	t.is(file.sourceMap.mappings, 'AAAA;CACC,aAAa;AACd');
	const contents = file.contents.toString();
	t.true(/flex/.test(contents));
	t.true(/sourceMappingURL=data:application\/json;charset=utf8;base64/.test(contents));
});

test('read upstream source maps', async t => {
	let testFile;
	const stream = autoprefixer();
	const write = sourceMaps.write();
	const sourcesContent = [
		'a {\n  display: flex;\n}\n',
		'a {\n\tdisplay: flex;\n}\n'
	];

	const data = pEvent(write, 'data');

	stream.pipe(write);

	stream.end(
		testFile = new Vinyl({
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

	const file = await data;
	t.is(file.sourceMap.sourcesContent[0], sourcesContent[0]);
	t.is(file.sourceMap.sourcesContent[1], sourcesContent[1]);
});
