module.exports = function ($q) {
	var fbFactory = {
		login: function () {
			var deferred = $q.defer();
			FB.login(function (response) {
				if (response.authResponse) {
					FB.api('/me?', {
						fields: 'id,name,picture.type(large),email'
					}, function (response) {
						deferred.resolve(response);
					});
				} else {
					deferred.reject(response);
					console.log('User cancelled login or did not fully authorize.');
				}
			});
			return deferred.promise;
		},
		//TODO - What is the use case for signing a user out of facebook?
		logout: function () {
			FB.logout(function (response) {

			});
		},
		checkFaceBookLoginStatus: function () {
			var deferred = $q.defer();
			var _self = this;
			FB.getLoginStatus(function (response) {
				if (response.status === 'connected') {
					// The user is logged in and has authenticated your
					// app, and response.authResponse supplies
					// the user's ID, a valid access token, a signed
					// request, and the time the access token
					// and signed request each expire.

					// var uid = response.authResponse.userID;
					// var accessToken = response.authResponse.accessToken;
					var user = _self.getMe();
					deferred.resolve(user);
				} else if (response.status === 'authorization_expired') {
					// The user has signed into your application with
					// Facebook Login but must go through the login flow
					// again to renew data authorization. You might remind
					// the user they've used Facebook, or hide other options
					// to avoid duplicate account creation, but you should
					// collect a user gesture (e.g. click/touch) to launch the
					// login dialog so popup blocking is not triggered.
					var error = "Whoops, you've previously logged in with Facebook but we need to re-authorize! Please click the Login with Facebook button!";
					deferred.reject(error);
				} else if (response.status === 'not_authorized') {
					// The user hasn't authorized your application.  They
					// must click the Login button, or you must call FB.login
					// in response to a user gesture, to launch a login dialog.
					var user = _self.login();
					deferred.resolve(user);
				} else {
					// The user isn't logged in to Facebook. You can launch a
					// login dialog with a user gesture, but the user may have
					// to log in to Facebook before authorizing your application.
					// var error = "You're not signed in to Facebook! Please click the Login with Facebook button!";
					// deferred.reject(error);
					var user = _self.login();
					deferred.resolve(user);
				}
			});
			return deferred.promise;
		},
		getMe: function () {
			var deferred = $q.defer();
			FB.api('/me', {
				fields: 'id,name,picture.type(large),email'
			}, function (response) {
				if (!response || response.error) {
					deferred.reject('Error occured');
					console.log(response.error)
				} else {
					deferred.resolve(response);
				}
			});
			return deferred.promise;
		},
		watchLoginChange: function () {

			var _self = this;

			FB.Event.subscribe('auth.authResponseChange', function (res) {
				console.log(res);

				if (res.status === 'connected') {

					/*
					 The user is already logged,
					 is possible retrieve his personal info
					*/
					_self.getFbUserInfo();

					/*
					 This is also the point where you should create a
					 session for the current user.
					 For this purpose you can use the data inside the
					 res.authResponse object.
					*/

				}
				else {

					/*
					 The user is not logged to the app, or into Facebook:
					 destroy the session on the server.
					*/

				}

			});
		}
	};
	return fbFactory;
};