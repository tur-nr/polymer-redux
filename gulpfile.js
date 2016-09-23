const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const rollup = require('rollup').rollup;
const babelRollup = require('rollup-plugin-babel');

gulp.task('default', ['build']);

gulp.task('build:dist', () => {
    return rollup({
        entry: 'src/index.js',
        plugins: [
            babelRollup({
                presets: [
                    [ 'es2015', { 'modules': false } ]
                ],
                plugins: [ 'external-helpers' ]
            })
        ]
    }).then((bundle) => {
        return bundle.write({
            format: 'umd',
            moduleName: 'PolymerRedux',
            dest: 'dist/polymer-redux.js'
        })
    })
})

gulp.task('build:lib', () => {
    return gulp.src(['src/**/*.js'])
        .pipe(babel({
            presets: [ 'es2015' ]
        }))
        .pipe(gulp.dest('lib'))
})

gulp.task('build', ['build:lib', 'build:dist'], () => {
    return gulp.src(['dist/polymer-redux.js'])
        .pipe(uglify())
        .pipe(rename('polymer-redux.min.js'))
        .pipe(gulp.dest('dist'))
})
