module.exports = function ($scope, $rootScope, $state, auth, businessFactory, $uibModal, $stateParams, notificationFactory) {
    if ($stateParams.tier !== null) {
        $scope.tier = $stateParams.tier;
    }
    $scope.selectedQuery = {};
    if ($rootScope.currLocation) {
        $scope.mapLocation = $rootScope.currLocation.city;
    } else {
        $scope.mapLocation = 'Brooklyn';
    }
    //Watch the query being entered into the places autocomplete field
    $scope.$watch('query', function (newVal, oldVal) {
        if (newVal && newVal !== oldVal) {
            //if it's new and not equal to the oldval update the selectedQuery
            angular.copy($scope.query, $scope.selectedQuery);
            $scope.mapLocation = $scope.query.formatted_address;
            $scope.displayPhotos = [];
            if (newVal.photos) {
                for (var photoIndex = 0; photoIndex < 3; photoIndex++) {
                    if (newVal.photos[photoIndex]) {
                        $scope.displayPhotos.push(newVal.photos[photoIndex].getUrl({
                            'minWidth': 100,
                            'minHeight': 100,
                            'maxWidth': 100,
                            'maxHeight': 100
                        }));
                    }
                }
            }

        }
        if (!newVal && oldVal && newVal !== null) {
            //if there's no new query but there's and old one, set selected equal to the old one
            $scope.selectedQuery = oldVal;
        }
    });
    $scope.$watch('selectedQuery.formatted_address', function (newVal, oldVal) {
        if (newVal && newVal !== oldVal) {
            $scope.mapLocation = $scope.selectedQuery.formatted_address;
        }
    });
    $scope.updateQuery = function () {
        $scope.query = null;
        $scope.displayPhotos = [];
        angular.copy($scope.selectedQuery.formatted_address, $scope.query);
    };
    $scope.accountSwitch = function (accountType) {
        if (accountType == 'individual') {
            $scope.displayPhotos = [];
            $scope.query = null;
        }
    };
    $scope.autocompleteOptions = {
        componentRestrictions: {country: 'us'},
        types: ['establishment']
    };

    $scope.search = function () {
        businessFactory.search($scope.query)
            .then(function (data) {
                $scope.queryResults = data;
            });
    };
    /**
     * Submits a claim request for a business
     *
     * @param request - the selectedQuery object, google places business
     * @param personToNotify
     */
    $scope.claim = function (request, personToNotify) {
        var claimRequest = {};
        claimRequest.phoneNumber = request.formatted_phone_number;
        claimRequest.address = request.formatted_address;
        claimRequest.now = moment().format('MMM Do YYYY, h:mm:ss a');
        claimRequest.placesId = request.place_id;
        claimRequest.name = request.name;
        claimRequest.tier = $scope.tier;
        claimRequest.accountType = $scope.accountType;
        claimRequest.shopModel = $scope.shopModel;
        claimRequest.shopSize = $scope.shopSize;
        businessFactory.claim(claimRequest)
            .then(function (data) {
                    //TODO Move this string to somewhere we can access it globally!
                    if (data.status === 200) {
                        notificationFactory.addNotification(personToNotify,
                            'We have received your request to claim ' + request.name + '. You should hear back from us soon!', false)
                            .then(function () {

                            }, function (err) {
                                console.log(err);
                            });
                    }
                    $uibModal.open({
                        templateUrl: 'partials/modals/businessRequestModal.html',
                        controller: 'ModalInstanceCtrl',
                        resolve: {
                            message: function () {
                                return data;
                            },
                            info: function () {
                                return request;
                            }
                        }
                    });
                },
                function (error) {
                    $uibModal.open({
                        templateUrl: 'partials/modals/businessRequestModal.html',
                        controller: 'ModalInstanceCtrl',
                        resolve: {
                            message: function () {
                                return error;
                            },
                            info: function () {
                                return request;
                            }
                        }
                    });
                }
            );
    };
};
