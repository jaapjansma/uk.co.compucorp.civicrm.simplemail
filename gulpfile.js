var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var notify = require('gulp-notify');

/**
 * CSS operations
 */
gulp.task('css', function () {
  return gulp.src('css/src/style.scss')
    .pipe(sass({style: 'compressed', sourcemap: true}))
    .pipe(autoprefixer())
    .pipe(gulp.dest('css/dist'))
    .pipe(notify({message: 'CSS tasks complete!'}));
});

gulp.task('javascript', function () {
  return gulp.src('js/src/*.js')
    .pipe(uglify())
    .pipe(concat('script.js'))
    .pipe(gulp.dest('js/dist'))
    .pipe(notify({message: 'JavaScript tasks complete'}));
});

/**
 * Watch
 */
gulp.task('watch', function () {
  gulp.watch('css/src/*.scss', ['css']);
  gulp.watch('js/src/*.js', ['javascript']);
});

/**
 * Default task
 */
gulp.task('default', ['watch', 'css', 'javascript']);
