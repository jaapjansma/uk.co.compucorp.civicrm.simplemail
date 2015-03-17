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
	
	// the change to the gulpfile is due to this:
	// http://stackoverflow.com/questions/28140012/gulp-typeerror-arguments-to-path-join-must-be-strings
	
  return 
  	//gulp.src('css/src/style.scss')
  	sass('css/src/style.scss', {style: 'compressed', sourcemap: true})
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

gulp.task('javascript-debug', function(){
  return gulp.src('js/src/*.js')
    .pipe(concat('script.js'))
    .pipe(gulp.dest('js/dist'));
});

/**
 * Watch
 */
gulp.task('watch', function () {
  gulp.watch('css/src/*.scss', ['css']);
  gulp.watch('js/src/*.js', ['javascript']);
});


gulp.task('watch-debug', function(){
  gulp.watch('css/src/*.scss', ['css']);
  gulp.watch('js/src/*.js', ['javascript-debug']);
});

/**
 * Default task
 */
gulp.task('default', ['watch', 'css', 'javascript']);
