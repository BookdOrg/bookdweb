# README #

##Build Status##
*
[![Build Status](https://drone.io/bitbucket.org/knb6/bookdweb/status.png)](https://drone.io/bitbucket.org/knb6/bookdweb/latest)

#Import categories json into your DB
*mongoimport --db clientconnect --collection categories --file clientconnect-categories --type json

#SET ENVIRONMENT VARIABLES
*alias handiEnv=". ~/Documents/handi-staging/setVariables.sh"

*export NODE_ENV=development
*export devhost=localhost
*export devcloudinarySecret=oPwyFfDS9Zhprx3NibKbFoFanjw
*export devlocalPort=3002
*export GOOGLE_PLACES_API_KEY=AIzaSyB-hJk0rUSYf1V_Yf_XXxdOJPpeTiodFTo
*export GOOGLE_PLACES_OUTPUT_FORMAT=json
*export devsocketPort=3001
*export yelpconsumersecret=0p5OnO_XT-Qfwtl_TIVCrG_lPpU
*export yelptokensecret=-k-uGXRUaO14iTrFTQqpG1HztMc

Finally in your terminal type:
*source ~/.bash_profile