/**
 * Created by jonfor on 11/24/15.
 */
var ENV = process.env.NODE_ENV || 'development';
var browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    concatCss = require('gulp-concat-css'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    cleanCSS = require('gulp-clean-css'),
    ngAnnotate = require('gulp-ng-annotate'),
    plumber = require('gulp-plumber'),
    source = require('vinyl-source-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    ngConfig = require('gulp-ng-config'),
	imagemin = require('gulp-imagemin'),
    path = require('path'),
    fs = require('fs'),
    config = require('./config.js'),
	errorify = require('errorify'),
    watchify = require('watchify');

// Define file path variables
var paths = {
    root: 'routes',                     // App root path
    src: 'public/javascripts/',         // Source path
    publicSrc: 'public/',
    dist: 'public/javascripts/dist/',   // Distribution path
    test: 'testSpecs/',                 // Test path
    css: 'public/stylesheets/**/*',         // Stylesheets path
    cssIgnore: '!public/stylesheets/**/*.min.css', //Stylesheets to ignore
	cssNav: 'public/stylesheets/nav/bookdnavbar.css',
	landingNav: 'public/stylesheets/nav/landingNav.css',
	agencyCss: 'public/stylesheets/nav/agency.css',
    cssDist: 'public/stylesheets/dist/',  // Stylesheets dist path
    fullCal:'node_modules/fullcalendar/dist/fullcalendar.css',
    fullCalPrint: 'node_modules/fullcalendar/dist/fullcalendar.print.css',
	fontAwesome: 'node_modules/@fortawesome/fontawesome-free/css/all.css',
    bootStrap:'node_modules/bootstrap/dist/css/bootstrap.css',
    angularUI:'node_modules/angular-ui-notification/dist/angular-ui-notification.css',
    angularPlaces:'bower_components/angular-google-places-autocomplete/dist/autocomplete.min.css',
	angularUICal:'node_modules/angular-ui-calendar/src/calendar.js',
	googlePlaces:'bower_components/angular-google-places-autocomplete/dist/autocomplete.min.js',
	geolocation: 'bower_components/ngGeolocation/ngGeolocation.js'

};

var bundler = watchify(browserify({
    entries: paths.src + 'app.js', // Only need initial file, browserify finds the deps
    debug: true // Gives us sourcemapping
}, watchify.args));

gulp.task('browserify', function () {
    bundle();
    bundler.on('update', bundle);

    bundler.on('time', function (time) {
        gutil.log('Browserify', 'rebundling took ', gutil.colors.cyan(time + ' ms'));
    });
});

gulp.task('browserifyProd', function () {
    bundleProd();
    bundler.on('update', bundleProd);

    bundler.on('time', function (time) {
        gutil.log('BrowserifyProd', 'rebundling took ', gutil.colors.cyan(time + ' ms'));
    });
	minImages();
});

let bundlerOnce = browserify({
    entries: paths.src + 'app.js', // Only need initial file, browserify finds the deps
    debug: true // Gives us sourcemapping
});
bundlerOnce.plugin(errorify);
gulp.task('browserifyProdOnce', function (done) {
    bundleProdOnce()
        .on('time', function (time) {
            gutil.log('BrowserifyProdOnce', 'rebundling took ', gutil.colors.cyan(time + ' ms'));
        })
	    .on('error', function (err) {
		    gutil.log(gutil.colors.red('[Error]'), err.toString());
	    });
	minImages();
});

gulp.task('ng-config', function () {
    configure();
});

//TODO Get this working. Rules seem to cascade incorrectly when concat and minified.
gulp.task('minify-css', function () {
    minifyCss()
        .on('time', function (time) {
            gutil.log('Minify-CSS', 'minifying', gutil.colors.cyan(time + ' ms'));
        });
    minifyNavCss()
	    .on('update', function(time){
		    gutil.log('Minify-CSS', 'minifying', gutil.colors.cyan(time + ' ms'));
	    });
});
gulp.task('minify-css-prod', function () {
	minifyCssProd()
		.on('time', function (time) {
			gutil.log('Minify-CSS', 'minifying', gutil.colors.cyan(time + ' ms'));
		});
	minifyNavCssProd()
		.on('update', function(time){
			gutil.log('Minify-CSS', 'minifying', gutil.colors.cyan(time + ' ms'));
		});
});

gulp.task('minify-images', function () {
	minImages()
		.on('update', function (time) {
			gutil.log('Minify-Images', 'minifying', gutil.colors.cyan(time + ' ms'));
		});
});

function minifyCss() {
    return gulp.src([paths.bootStrap, paths.agencyCss, paths.css, paths.fontAwesome, paths.fullCal, paths.angularUI, paths.angularPlaces])
        .pipe(sourcemaps.init({loadMaps: true}))
	    .pipe(concatCss('bundle.css', {newLine: ""}))
        .pipe(cleanCSS({debug: false, rebase: true}, function (details) {
            console.log(details.name + ': ' + details.stats.originalSize);
            console.log(details.name + ': ' + details.stats.minifiedSize);
            console.log(details.name + ': ' + details.stats.efficiency);
            console.log(details.name + ': ' + details.warnings);

        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.cssDist));
}
function minifyNavCss(){
	return gulp.src([paths.agencyCss,paths.landingNav, paths.cssNav])
		.pipe(sourcemaps.init({loadMaps:false}))
		.pipe(cleanCSS({debug: true, rebase: true}, function(details){
			console.log(details.name + ': ' + details.stats.originalSize);
			console.log(details.name + ': ' + details.stats.minifiedSize);
			console.log(details.name + ': ' + details.stats.efficiency);
			console.log(details.name + ': ' + details.warnings);
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(paths.cssDist));
}
function minifyCssProd() {
	return gulp.src([paths.bootStrap, paths.agencyCss, paths.css, paths.fontAwesome, paths.fullCal, paths.angularUI, paths.angularPlaces])
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(concatCss('bundle.css', {newLine: ""}))
		.pipe(cleanCSS({debug: false, rebase: true}, function (details) {
			console.log(details.name + ': ' + details.stats.originalSize);
			console.log(details.name + ': ' + details.stats.minifiedSize);
			console.log(details.name + ': ' + details.stats.efficiency);
			console.log(details.name + ': ' + details.warnings);

		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(paths.cssDist));
}
function minifyNavCssProd(){
	return gulp.src([paths.agencyCss,paths.landingNav, paths.cssNav])
		.pipe(sourcemaps.init({loadMaps:false}))
		.pipe(cleanCSS({debug: true, rebase: true}, function(details){
			console.log(details.name + ': ' + details.stats.originalSize);
			console.log(details.name + ': ' + details.stats.minifiedSize);
			console.log(details.name + ': ' + details.stats.efficiency);
			console.log(details.name + ': ' + details.warnings);
		}))
		// .pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(paths.cssDist));
}
function configure() {
    fs.writeFileSync('./config.json',
        JSON.stringify(config[ENV]));
    gulp.src('./config.json')
        .pipe(
            ngConfig('ngEnvVars.config', {
                createModule: false
            })
        )
        .pipe(gulp.dest('./public/javascripts'))
}

function bundle() {
    return bundler.bundle()
        .pipe(plumber({errorHandler: errorHandler}))
        .pipe(source('app.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.dist));
}

function bundleProd() {
    return bundler.bundle()
        .pipe(plumber({errorHandler: errorHandler}))
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(ngAnnotate())
        .pipe(uglify({mangle: false}))
        // .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.dist));
}

function bundleProdOnce() {
    return bundlerOnce.bundle()
        .pipe(plumber({errorHandler: errorHandler}))
        .pipe(source('app.js'))
        .pipe(buffer())
        // .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(ngAnnotate())
	    .pipe(uglify({mangle: false})
		    .on('error', function (err) {
			    gutil.log(gutil.colors.red('[Error]'), err.toString());
			    this.emit('end');
		    }))
	    // .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.dist));
}

function minImages() {
	return gulp.src('./public/images/*')
		.pipe(imagemin([
			imagemin.optipng({
				optimizationLevel: 5,
				interlaced: true,
				progressive: true
			}),
			imagemin.jpegtran({
				optimizationLevel: 5,
				interlaced: true,
				progressive: true
			}),
		], {verbose: true}))
		.pipe(gulp.dest('./public/images/dist/'))
}
function errorHandler(err) {
    gutil.log(gutil.colors.red('Error: ' + err.message));
}

gulp.task('default', [], function () {
    gulp.start('ng-config');
    gulp.start('minify-css');
    gulp.start('browserify');
});
