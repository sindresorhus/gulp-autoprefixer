import {Buffer} from 'node:buffer';
import applySourceMap from 'vinyl-sourcemaps-apply';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import {gulpPlugin} from 'gulp-plugin-extras';

export default function gulpAutoprefixer(options) {
	return gulpPlugin('gulp-autoprefixer', async file => {
		try {
			const result = await postcss(autoprefixer(options)).process(file.contents.toString(), {
				map: file.sourceMap ? {annotation: false} : false,
				from: file.path,
				to: file.path,
			});

			file.contents = Buffer.from(result.css);

			if (result.map && file.sourceMap) {
				const map = result.map.toJSON();
				map.file = file.relative;
				map.sources = map.sources.map(() => file.relative);
				applySourceMap(file, map);
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
