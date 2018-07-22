module.exports = function ($scope, $state, auth, $uibModalInstance, modalType, state, socketService, $rootScope,
                           userFactory, notificationFactory, tier, context, facebookService) {
    $scope.user = {};
    $scope.tabs = [
        {
            title: 'Log In'
        },
        {
            title: 'Sign up'
        }
    ];
    $scope.contextMessage = false;
    $scope.activeTab = 0;
    if (modalType === 'login') {
        $scope.activeTab = 0;
    } else if (modalType === 'signup') {
        $scope.activeTab = 1;
    }
    if (context === "businessRegister") {
        $scope.contextMessage = true;
    }
	let onlineData = {
        user: '',
        location: {}
    };
    $scope.refreshErrors = function () {
        $scope.error = null;
        $scope.user = {};
    };
	//TODO handle all the possible error cases
    $scope.facebookLogin = function () {
	    facebookService.checkFaceBookLoginStatus()
		    .then(function (response) {
				    if (response.authResponse)
					    let user = {
						    username: response.email,
						    provider: 'facebook'
					    };
				    auth.logIn(user, response.picture.data.url)
					    .then(function () {
						    onlineData.user = $rootScope.currentUser._id;
						    socketService.emit('online', onlineData);
						    $state.go(state, {tier: tier});
						    getNotifications();
						    $uibModalInstance.close();
					    }, function (error) {
						    $scope.error = error.message;
					    });
			    },
			    function (error) {
				    $scope.error = error;
			    });
    };
    $scope.facebookSignup = function () {
	    facebookService.checkFaceBookLoginStatus()
		    .then(function (response) {
				    let firstLast = response.name.split(' ', 2);
				    let firstName = firstLast[0];
				    let lastName = firstLast[1];
				    let user = {
					    'username': response.email,
					    'name': response.name,
					    'firstName': firstName,
					    'lastName': lastName,
					    'provider': 'facebook',
					    'providerId': response.id
				    };
				    // let profilePicture = response.picture.data.url;
				    auth.logIn(user, response.picture.data.url)
					    .then(function () {
						    onlineData.user = $rootScope.currentUser._id;
						    socketService.emit('online', onlineData);
						    $state.go(state, {tier: tier});
						    getNotifications();
						    $uibModalInstance.close();
					    }, function (error) {
						    $scope.error = error;
					    });
			    },
			    function (error) {
				    $scope.error = error;
			    });
    };
    /**
     * Register via Bookd
     */
    $scope.register = function () {
	    let user = {
            'username': $scope.user.email,
            'name': $scope.user.firstName + ' ' + $scope.user.lastName,
            'firstName': $scope.user.firstName,
            'lastName': $scope.user.lastName,
            'password': $scope.user.password,
            'provider': 'bookd'
        };
        auth.register(user)
            .then(function () {
                onlineData.user = $rootScope.currentUser._id;
                socketService.emit('online', onlineData);
                $state.go(state, {tier: tier});
                $rootScope.currentUser.notifications = [];
                $uibModalInstance.close();
            }, function (error) {
                $scope.error = error.message;
            });
    };
    /**
     * Login via Bookd
     */
    $scope.logIn = function () {
	    let user = {
            'username': $scope.user.email,
            'password': $scope.user.password,
            'provider': 'bookd'
        };
        auth.logIn(user)
            .then(function () {
                onlineData.user = $rootScope.currentUser._id;
                socketService.emit('online', onlineData);
                getNotifications();
                $state.go(state, {tier: tier});
                $uibModalInstance.close();
            }, function (error) {
                $scope.error = error.message;
            });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('close');
    };

	let getNotifications = function () {
        notificationFactory.getNotifications().then(
            function (data) {
                $rootScope.currentUser.notifications = data;
            },
            function (err) {
                console.log(err);
            }
        );
    };

    $scope.reset = function () {
        $uibModalInstance.close();
    };

    $scope.$on('$destroy', function (event) {
        socketService.removeAllListeners();
    });
};
