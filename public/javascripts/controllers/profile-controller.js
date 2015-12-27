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
        if (data.user.provider === 'google_plus') {
            userFactory.getGooglePhoto(data.user.providerId)
                .then(function (response) {
                    $scope.user.photo = response.image.url.replace('sz=50', 'sz=200');
                });
        }
    });

    $scope.facebookApi = facebookApi;
};