/**
 * Created by jonfor on 11/24/15.
 */
var browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    ngAnnotate = require('gulp-ng-annotate'),
    notifier = require('node-notifier'),
    plumber = require('gulp-plumber'),
    source = require('vinyl-source-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    watchify = require('watchify');

// Define file path variables
var paths = {
    root: 'routes',             // App root path
    src: 'public/javascripts/', // Source path
    dist: 'public/javascripts/dist/',              // Distribution path
    test: 'testSpecs/'          // Test path
};

//TODO Make this work with watchify
gulp.task('browserifyProd', function () {
    return browserify({
        entries: paths.src + 'app.js', // Only need initial file, browserify finds the deps
        debug: true // Gives us sourcemapping
    })
        .bundle() // Create the initial bundle when starting the task
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(ngAnnotate())
        .pipe(uglify({mangle: false}))
        .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.dist));
});

var bundler = watchify(browserify({
    entries: paths.src + 'app.js', // Only need initial file, browserify finds the deps
    debug: true // Gives us sourcemapping
}, watchify.args));

gulp.task('browserify', bundle);

bundler.on('update', bundle);

function bundle() {
    return bundler.bundle()
        .pipe(plumber({errorHandler: errorHandler}))
        .pipe(source('app.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.dist));
}

bundler.on('time', function (time) {
    gutil.log('Browserify', 'rebundling took ', gutil.colors.cyan(time + ' ms'));
});

function errorHandler(err) {
    notifier.notify({message: 'Error: ' + err.message});
    gutil.log(gutil.colors.red('Error: ' + err.message));
}

gulp.task('default', [], function () {
    gulp.start('browserify');
});
