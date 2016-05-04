var gulp = require('gulp'),
    plumber = require('plumber'),
    gulp_concat = require('gulp-concat'),
    gulp_uglify = require('gulp-uglify'),
    gulp_uglifycss = require('gulp-uglifycss'),
    run_sequence = require('run-sequence');

gulp.task('build:js', function() {
  return gulp.src([
    '_src/js/**/*.js'
  ])
    .pipe(gulp_concat('app.min.js'))
    .pipe(gulp_uglify())
    .pipe(gulp.dest('./'));
});


gulp.task('build:css', function() {
  return gulp.src([
    '_src/css/**/*.css'
  ])
    .pipe(gulp_concat('styles.min.css'))
    .pipe(gulp_uglifycss())
    .pipe(gulp.dest('./'));
});

gulp.task('build', function() {
  run_sequence('build:js');
  run_sequence('build:css');
})
