import {Buffer} from 'node:buffer';
import applySourceMap from 'vinyl-sourcemaps-apply';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import {gulpPlugin} from 'gulp-plugin-extras';

export default function gulpAutoprefixer(options) {
	return gulpPlugin('gulp-autoprefixer', async file => {
		try {
			const result = await postcss(autoprefixer(options)).process(file.contents.toString(), {
				map: file.sourceMap ? {annotation: false, prev: file.sourceMap} : false,
				from: file.path,
				to: file.path,
			});

			file.contents = Buffer.from(result.css);

			if (result.map && file.sourceMap) {
				applySourceMap(file, result.map.toJSON());
			}

			const warnings = result.warnings();
			if (warnings.length > 0) {
				console.log('gulp-autoprefixer:', '\n  ' + warnings.join('\n  '));
			}

			return file;
		} catch (error) {
			if (error.name === 'CssSyntaxError') {
				error.message += error.showSourceCode();
				error.isPresentable = true;
			}

			throw error;
		}
	});
}
