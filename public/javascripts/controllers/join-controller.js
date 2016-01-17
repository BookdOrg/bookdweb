module.exports = function ($scope, $state, auth, businessFactory, $uibModal, $stateParams, notificationFactory) {
    if ($stateParams.tier !== null) {
        $scope.tier = $stateParams.tier;
    }
    //Watch the query being entered into the places autocomplete field
    $scope.$watch('query', function (newVal, oldVal) {
        if (newVal && newVal !== oldVal) {
            //if it's new and not equal to the oldval update the selectedQuery
            $scope.selectedQuery = $scope.query;
            $scope.displayPhotos = [];
            if (newVal.photos) {
                for (var photoIndex = 0; photoIndex < newVal.photos.length; photoIndex++) {
                    $scope.displayPhotos.push(newVal.photos[photoIndex].getUrl({'maxWidth': 100, 'maxHeight': 100}));
                }
            }

        }
        if (!newVal && oldVal) {
            //if there's no new query but there's and old one, set selected equal to the old one
            $scope.selectedQuery = oldVal;
        }

        if ($scope.query && $scope.query.geometry) {
            //if there's a query and it has geometry, set the center of the map to be the business
            $scope.center = $scope.query.geometry.location.lat() + ',' + $scope.query.geometry.location.lng();
        }
    });

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
        claimRequest.now = moment().format('MMM Do YYYY, h:mm:ss a');
        claimRequest.placesId = request.place_id;
        claimRequest.name = request.name;
        claimRequest.tier = $scope.tier;
        businessFactory.claim(claimRequest)
            .then(function (data) {
                //TODO Move this string to somewhere we can access it globally!
                notificationFactory.addNotification(personToNotify,
                    'We have received your request to claim ' + request.name + '. You should hear back from us soon!', false)
                    .then(function () {

                    }, function (err) {
                        console.log(err);
                    });
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
