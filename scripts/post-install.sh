#!/usr/bin/env bash
node_modules/bower/bin/bower install
node_modules/gulp/bin/gulp.js ng-config
node_modules/gulp/bin/gulp.js minify-cssOnce
node_modules/gulp/bin/gulp.js browserifyProdOnce
node_modules/gulp/bin/gulp.js minify-css-prod