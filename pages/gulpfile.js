var gulp = require('gulp'),
    plumber = require('plumber'),
    gulp_concat = require('gulp-concat'),
    gulp_uglify = require('gulp-uglify');

gulp.task('build:js', function() {
  return gulp.src([
    '_src/js/**/*.js'
  ])
    .pipe(gulp_concat('app.min.js'))
    .pipe(gulp_uglify())
    .pipe(gulp.dest('./'));
});
