/**
 * Created by jonfor on 11/24/15.
 */
var browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    ngAnnotate = require('gulp-ng-annotate'),
    source = require('vinyl-source-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify');


// Define file path variables
var paths = {
    root: 'routes',             // App root path
    src: 'public/javascripts/', // Source path
    dist: 'public/javascripts/dist/',              // Distribution path
    test: 'testSpecs/'          // Test path
};

gulp.task('browserify', function () {
    return browserify({
        entries: paths.src + 'app.js', // Only need initial file, browserify finds the deps
        debug: true // Gives us sourcemapping
    })
        .bundle() // Create the initial bundle when starting the task
        .pipe(source('app.js'))
        //.pipe(buffer())
        //.pipe(sourcemaps.init({loadMaps: true}))
        //    // Add transformation tasks to the pipeline here.
        //    .pipe(ngAnnotate())
        //    .pipe(uglify())
        //    .on('error', gutil.log)
        //.pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('default', [], function () {
    gulp.start('browserify');
});

gulp.task('watch', ['browserify'], function () {
    gulp.watch(['public/javascripts/**/*.js', '!public/javascripts/dist/*'], ['browserify']);
});