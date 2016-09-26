const gulp = require('gulp')
const babel = require('gulp-babel')
const rename = require('gulp-rename')
const rollup = require('rollup').rollup
const babelRollup = require('rollup-plugin-babel')

gulp.task('default', ['build'])

gulp.task('build:dist', () => {
    return rollup({
        entry: 'src/index.js',
        plugins: [
            babelRollup({
                plugins: [
                    'external-helpers',
                    'transform-es2015-arrow-functions',
                    'transform-es2015-block-scoping',
                    'transform-es2015-destructuring',
                    'transform-es2015-parameters',
                    'transform-es2015-shorthand-properties',
                    ['transform-es2015-spread', { loose: true }],
                    ['transform-es2015-template-literals', { spec: true }]
                ]
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

gulp.task('build', [/*'build:lib', */'build:dist'], () => {
    return gulp.src(['dist/polymer-redux.js'])
        .pipe(babel({
            presets: ['babili'],
            plugins: ['remove-comments']
        }))
        .pipe(rename('polymer-redux.min.js'))
        .pipe(gulp.dest('dist'))
})

gulp.task('develop', ['build:dist'], () => {
    gulp.watch(['src/**/*.js'], ['build:dist'])
})
