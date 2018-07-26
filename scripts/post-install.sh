#!/usr/bin/env bash
rm -rf public/javascripts/dist/
rm -rf public/stylesheets/dist/
rm -rf public/images/dist/
node_modules/bower/bin/bower install
node_modules/gulp/bin/gulp.js ng-config
node_modules/gulp/bin/gulp.js browserifyProdOnce
node_modules/gulp/bin/gulp.js minify-css-prod