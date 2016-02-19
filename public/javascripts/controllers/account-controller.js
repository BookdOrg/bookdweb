module.exports = function ($scope, auth, userFactory, $location, $sce, FileUploader, $state, $stateParams, $rootScope, $timeout, $uibModal) {
    //TODO Add callbacks for error cases
    /**
     * Lines 9-43
     *
     * Initialize use of the FileUploader, adding required headers by the bookd backend
     */
    var uploader = $scope.uploader = new FileUploader({
        url: '/upload',
        headers: {
            Authorization: 'Bearer ' + auth.getToken()
        }
    });
    $scope.showLoader = false;
    /**
     * After a file is added to the loader we want to display it
     */
    uploader.onAfterAddingFile = function () {
        $scope.showLoader = true;
    };
    /**
     * FileUploader callback
     *
     * After the upload is complete we make a request to get the users
     * appointments so they are correctly displayed in the navbar
     *
     *
     * @param item - the photo that was uploaded
     */
    uploader.onCompleteItem = function (item) {
        uploader.removeFromQueue(item);
    };

    /**
     * FileUploader callback
     *
     * When the request is successfully completed the backend will
     * return the response object which is the users authentication
     * token, we save the new one and update the currentUser based
     * the unencrypted token
     *
     *
     * @param item - the photo that was uploaded
     * @param response
     * @param status
     */
    uploader.onSuccessItem = function (item, response, status) {
        $rootScope.currentUser.avatarVersion = response;
        auth.saveUser(null, $rootScope.currentUser);
        $scope.showLoader = false;

    };
    uploader.filters.push({
        name: 'imageFilter',
        fn: function (item /*{File|FileLikeObject}*/, options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    });
    $scope.animationsEnabled = true;
    /**
     *
     * Opens a modal that allows employees to update their availability.
     *
     * @param size - the size of the modal
     */
    $scope.openAvailabilityModal = function (size) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/partials/modals/updateAvailabilityModal.html',
            controller: 'updatedAvailabilityCtrl',
            backdrop: 'static',
            keyboard: false,
            size: size,
            resolve: {
                employee: function () {
                    return $rootScope.currentUser;
                },
                business: function () {
                    return null;
                }
            }
        });
        modalInstance.result.then(function () {

        });

    };
    /**
     * Use Oauth.io to access Instagram and pull 10 pictures from a users account,
     * build out a view for the user to scroll and select the photos they want to add to their profile
     *
     */
    $scope.authorizeInstagram = function () {
        OAuth.popup('instagram')
        /**
         * result is the authenticated obj return from oAuth
         */
            .done(function (result) {
                /**
                 * accessing the GET function of the authenticated user, to hit any Instagram
                 * endpoint
                 */
                result.get('v1/users/self/media/recent/?count=10')
                    .done(function (response) {
                        /**
                         * Set the scope photos to equal the response we get from Instagram
                         */
                        $scope.photos = response.data;
                        var photos = compilePhotos(response.data);
                        var send = {
                            'photos': photos
                        };
                        //Calling Apply to make the view render the photos
                        $scope.$apply();
                        /**
                         * Add the photos to the users profile in the database
                         */
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
    $scope.updatingDescription = false;
    $scope.descriptionUpdated = false;
    $scope.updateDescription = function (newDescription) {
        $scope.updatingDescription = true;
        var associateDescription = {
            description: newDescription
        };
        userFactory.updateDescription(associateDescription)
            .then(function (data) {
                $rootScope.currentUser.associateDescription = data;
                $scope.updatingDescription = false;
                $scope.descriptionUpdated = true;
                $timeout(function () {
                    $scope.descriptionUpdated = false;
                }, 1500);
            });
    };

    $scope.changePassword = function () {
        console.log('Here');
        auth.changePassword($scope.currPass, $scope.newPass)
            .then(function (data) {
                $scope.passwordChanged = true;
                $scope.error = null;
            }, function (error) {
                $scope.error = error.error;
            })
    };

    /**
     *
     * Compile an array of just the photo urls of photos returned from Instagram
     *
     * @param photosArray - array of photo objects returned from Instagram
     * @returns {Array} - Returns just the url of each photo from the photo array
     */
    var compilePhotos = function (photosArray) {
        var photos = [];
        for (var photosAraryIndex = 0; photosAraryIndex < photosArray.length; photosAraryIndex++) {
            var photo = photosArray[photosAraryIndex].images.standard_resolution.url;
            photos.push(photo);
        }
        return photos;
    };
};
