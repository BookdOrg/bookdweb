# README #

[![Build Status](https://circleci.com/gh/BookdOrg/bookdweb/tree/development.png)](https://circleci.com/gh/BookdOrg/bookdweb/tree/development.png)

##Hip Chat##
* https://bookd.hipchat.com/chat

#Install NodeJS & MongoDB#
##OSX##
* Node tutorial: http://blog.teamtreehouse.com/install-node-js-npm-mac
* MongoDB tutorial: 
*Server https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-16-04

#Install and run Redis Server#
*https://medium.com/@petehouston/install-and-config-redis-on-mac-os-x-via-homebrew-eb8df9a4f298

##SET ENVIRONMENT VARIABLES##
Create a bash script to update environment variables or modify .bashrc

###Script Example###

* Paste this into your .bashrc or script

```bash

export NODE_ENV=development

export devhost=localhost

export devcloudinarySecret=Ask

export devlocalPort=3002

export GOOGLE_PLACES_API_KEY=Ask

export GOOGLE_PLACES_OUTPUT_FORMAT=json

export devsocketPort=3001

export emailPass=ASKFORPASSWORD

export jwtSecret=GENERATERANDOM

export stripeDevSecret=ASKFORSECRET

```

Finally in your terminal type:

* `source ~/.bashrc -- mac and most Linux`
* `. ~/.bashrc -- Ubuntu based distros`

#Fire up the app#
* npm install
* npm start

#Run gulp task to watch for changes to js files and browserify them#
* scripts/gulp-watch.sh

#(Optional) Download MongoHub as a MONGODB GUI interface#
* https://github.com/jeromelebel/MongoHub-Mac

###Starting ESLint in WebStorm:###
* File -> Settings -> Languages and Frameworks -> Javascript -> Code Quality Tools -> ESLint -> Check Enable
