// module.exports = function ($scope, $state, auth, businessFactory, $uibModal, $stateParams, notificationFactory) {
//     //Watch the query being entered into the places autocomplete field
//     $scope.$watch('query', function (newVal, oldVal) {
//         if (newVal && newVal !== oldVal) {
//             //if it's new and not equal to the oldval update the selectedQuery
//             $scope.selectedQuery = $scope.query;
//             $scope.displayPhotos = [];
//             if (newVal.photos) {
//                 for (var photoIndex = 0; photoIndex < 3; photoIndex++) {
//                     if (newVal.photos[photoIndex]) {
//                         $scope.displayPhotos.push(newVal.photos[photoIndex].getUrl({
//                             'maxWidth': 100,
//                             'maxHeight': 100
//                         }));
//                     }
//                 }
//             }
//
//         }
//         if (!newVal && oldVal) {
//             //if there's no new query but there's and old one, set selected equal to the old one
//             $scope.selectedQuery = oldVal;
//         }
//     });
//
//     $scope.autocompleteOptions = {
//         componentRestrictions: {country: 'us'},
//         types: ['establishment']
//     };
//
//     $scope.search = function () {
//         businessFactory.search($scope.query)
//             .then(function (data) {
//                 $scope.queryResults = data;
//             });
//     };
//     /**
//      * Submits a claim request for a business
//      *
//      * @param request - the selectedQuery object, google places business
//      * @param personToNotify
//      */
//     $scope.claim = function (request, personToNotify) {
//         var claimRequest = {};
//         claimRequest.phoneNumber = request.formatted_phone_number;
//         claimRequest.address = request.formatted_address;
//         claimRequest.now = moment().format('MMM Do YYYY, h:mm:ss a');
//         claimRequest.placesId = request.place_id;
//         claimRequest.name = request.name;
//         claimRequest.tier = $scope.tier;
//         businessFactory.claim(claimRequest)
//             .then(function (data) {
//                 //TODO Move this string to somewhere we can access it globally!
//                 if (data.status === 200) {
//                     notificationFactory.addNotification(personToNotify,
//                         'We have received your request to claim ' + request.name + '. You should hear back from us soon!', false)
//                         .then(function () {
//
//                         }, function (err) {
//                             console.log(err);
//                         });
//                 }
//                 $uibModal.open({
//                     templateUrl: 'partials/modals/businessRequestModal.html',
//                     controller: 'ModalInstanceCtrl',
//                     resolve: {
//                         message: function () {
//                             return data;
//                         },
//                         info: function () {
//                             return request;
//                         }
//                     }
//                 });
//             },
//             function (error) {
//                 $uibModal.open({
//                     templateUrl: 'partials/modals/businessRequestModal.html',
//                     controller: 'ModalInstanceCtrl',
//                     resolve: {
//                         message: function () {
//                             return error;
//                         },
//                         info: function () {
//                             return request;
//                         }
//                     }
//                 });
//             }
//         );
//     };
// };

module.exports = function ($scope, $state, auth, socketService, $rootScope) {
  $scope.user = {};
  $scope.refreshErrors = function () {
    $scope.error = null;
    $scope.user = {};
  };

  var onlineData = {
    user: '',
    location: {}
  };

  $scope.facebookSignup = function () {
    OAuth.popup('facebook', {cache: true})
      .done(function (result) {
        result.get('/me?fields=id,name,picture.type(large),email')
          .done(function (response) {
            var firstLast = response.name.split(' ', 2);
            var firstName = firstLast[0];
            var lastName = firstLast[1];
            var user = {
              'username': response.email,
              'name': response.name,
              'firstName': firstName,
              'lastName': lastName,
              'provider': result.provider,
              'providerId': response.id
            };
            var profilePicture = response.picture.data.url;
            auth.register(user, profilePicture)
              .then(function () {
                onlineData.user = $rootScope.currentUser._id;
                socketService.emit('online', onlineData);
                $rootScope.currentUser.notifications = [];
              }, function (error) {
                $scope.error = error.message;
              });
          })
          .fail(function (err) {
            //console.log(err);
          });
      })
      .fail(function (err) {
        //console.log(err);
      });
  };
  /**
   * Register via Bookd
   */
  $scope.register = function () {
    var user = {
      'username': $scope.user.email,
      'name': $scope.user.firstName + ' ' + $scope.user.lastName,
      'firstName': $scope.user.firstName,
      'lastName': $scope.user.lastName,
      'password': $scope.user.password,
      'phone': phone,
      'provider': 'bookd'
    };
    auth.register(user)
      .then(function () {
        onlineData.user = $rootScope.currentUser._id;
        socketService.emit('online', onlineData);
        $state.go('apply_one');
        $rootScope.currentUser.notifications = [];
      }, function (error) {
        $scope.error = error.message;
      });
  };

  $scope.$on('$destroy', function (event) {
    socketService.removeAllListeners();
  });
};

