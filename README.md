# README #

##Build Status##
* To be determined

##Hip Chat##
* https://bookd.hipchat.com/chat

#Install NodeJS & MongoDB#
##OSX##
* Node tutorial: http://blog.teamtreehouse.com/install-node-js-npm-mac
* MongoDB tutorial: http://docs.mongodb.org/manual/tutorials/install-mongodb-on-os-x/

##SET ENVIRONMENT VARIABLES##
Create a bash script to update environment variables or modify .bashrc

###Script Example###

* Paste this into your .bashrc or script

```bash
alias handiEnv=". ~/Documents/handi-staging/setVariables.sh"

export NODE_ENV=development

export devhost=localhost

export devcloudinarySecret=oPwyFfDS9Zhprx3NibKbFoFanjw

export devlocalPort=3002

export GOOGLE_PLACES_API_KEY=AIzaSyB-hJk0rUSYf1V_Yf_XXxdOJPpeTiodFTo

export GOOGLE_PLACES_OUTPUT_FORMAT=json

export devsocketPort=3001

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