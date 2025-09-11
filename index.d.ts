import type {Transform} from 'node:stream';
import type {Options} from 'autoprefixer';

/**
Prefix CSS with Autoprefixer.

@param options - Autoprefixer options.
@returns A transform stream.

@example
```
import gulp from 'gulp';
import autoprefixer from 'gulp-autoprefixer';

export default () => (
	gulp.src('src/app.css')
		.pipe(autoprefixer({
			cascade: false
		}))
		.pipe(gulp.dest('dist'))
);
```
*/
export default function gulpAutoprefixer(options?: Options): Transform;
