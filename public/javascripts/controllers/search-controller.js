module.exports = function ($scope, $state, auth, businessFactory, $uibModal, $stateParams) {
    if ($stateParams.tier !== null) {
        $scope.tier = $stateParams.tier;
    }
    $scope.$watch('query', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.selectedQuery = $scope.query;
        }
        if (!newVal && oldVal) {
            $scope.selectedQuery = oldVal;
        }

        if ($scope.query && $scope.query.geometry) {
            $scope.center = $scope.query.geometry.location.lat() + ',' + $scope.query.geometry.location.lng();
        }
    });

    businessFactory.getCategories();
    $scope.categoryOptions = businessFactory.categories;
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

    $scope.claim = function (request) {
        var claimRequest = {};
        claimRequest.now = moment().format('MMM Do YYYY, h:mm:ss a');
        claimRequest.placesId = request.place_id;
        claimRequest.name = request.name;
        claimRequest.tier = $scope.tier;
        businessFactory.claim(claimRequest)
            .then(function (data) {
                    $uibModal.open({
                        templateUrl: 'myModalContent.html',
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
                        templateUrl: 'myModalContent.html',
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
