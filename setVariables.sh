#!/bin/bash

#Set Node ENV Variables
if [[ ! -s "$HOME/.bash_profile" && -s "$HOME/.profile" ]] ; then
  profile_file="$HOME/.profile"
else
  profile_file="$HOME/.bash_profile"
fi

if ! grep -q 'export NODE_ENV=development' "${profile_file}"; then
	echo export NODE_ENV=development >> ~/.bash_profile
	echo export devhost=localhost >> ~/.bash_profile
	echo export devcloudinarySecret=oPwyFfDS9Zhprx3NibKbFoFanjw >> ~/.bash_profile
	echo export devlocalPort=3002 >> ~/.bash_profile
fi
source ~/.bash_profile
