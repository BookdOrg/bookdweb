module.exports = function ($scope, auth, userFactory, $location, $sce, FileUploader, $state, $stateParams, $rootScope) {
    //TODO Add callbacks for error cases
    var uploader = $scope.uploader = new FileUploader({
        url: '/upload',
        headers: {
            Authorization: 'Bearer ' + auth.getToken()
        }
    });
    $scope.showLoader = false;
    uploader.onAfterAddingFile = function () {
        $scope.showLoader = true;
    };
    uploader.onCompleteItem = function (item) {
        uploader.removeFromQueue(item);

        userFactory.getUserAppts().then(
            function (data) {
                $rootScope.currentUser.user.appointments = data;
            },
            function (errorMessage) {
                console.log(errorMessage);
            }
        );
    };
    uploader.onSuccessItem = function (item, response, status) {
        auth.saveToken(response.token);
        $rootScope.currentUser = auth.currentUser();
        $scope.showLoader = false;

    };
    uploader.filters.push({
        name: 'imageFilter',
        fn: function (item /*{File|FileLikeObject}*/, options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    });

    $scope.addBreak = function (day) {
        var gap = {
            start: moment().hour(12).minute(0).format(),
            end: moment().hour(13).minute(0).format()
        };
        day.gaps.push(gap);
    };

    $scope.hstep = 1;
    $scope.mstep = 15;
    $scope.ismeridian = true;
    $scope.toggleMode = function () {
        $scope.ismeridian = !$scope.ismeridian;
    };
    $scope.showDone = false;
    $scope.updateAvailability = function (availability) {
        $scope.showLoading = true;
        userFactory.updateAvailability(availability)
            .then(function (data) {
                auth.saveToken(data.token);
                $scope.showLoading = false;
                $scope.showDone = true;
            });
    };

    /**
     * Use Oauth.io to access instagram and pull 10 pictures from a users account,
     * build out a view for the user to scroll and select the photos they want to add to their profile
     *
     */
    $scope.authorizeInstagram = function () {
        OAuth.popup('instagram')
            .done(function (result) {
                result.get('v1/users/self/media/recent/?count=10')
                    .done(function (response) {
                        //this will display "John Doe" in the console
                        $scope.photos = response.data;
                        var photos = compilePhotos(response.data);
                        var send = {
                            'photos': photos
                        };
                        $scope.$apply();
                        userFactory.updateProfile(send);
                    })
                    .fail(function (err) {
                        console.log(err);
                        //handle error with err
                    });
            })
            .fail(function (err) {
                console.log(err);
                //handle error with err
            });
    };
    var compilePhotos = function (photosArray) {
        var photos = [];
        for (var photosAraryIndex = 0; photosAraryIndex < photosArray.length; photosAraryIndex++) {
            var photo = photosArray[photosAraryIndex].images.standard_resolution.url;
            photos.push(photo);
        }
        return photos;
    };
};
