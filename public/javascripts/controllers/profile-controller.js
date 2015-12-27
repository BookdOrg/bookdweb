module.exports = function ($scope, auth, userFactory, $location, $sce, FileUploader, $state, $stateParams, facebookApi) {
    $scope.hoveringOver = function (value) {
        $scope.overStar = value;
        $scope.percent = 100 * (value / $scope.max);
    };
    $scope.max = 5;
    $scope.isReadonly = false;
    $scope.rate = 2.5;
    userFactory.get($stateParams.id).then(function (data) {
        $scope.user = data.user;
    });

    $scope.facebookApi = facebookApi;
};