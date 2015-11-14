angular.module('cc.account-controller', [])
    .controller('AccountCtrl', ['$scope', 'auth', 'user', '$location', '$sce', 'FileUploader', '$state', '$stateParams', '$rootScope',
        function ($scope, auth, user, $location, $sce, FileUploader, $state, $stateParams, $rootScope) {
            var uploader = $scope.uploader = new FileUploader({
                url: '/upload',
                headers: {
                    Authorization: 'Bearer ' + auth.getToken()
                }
            });
            $scope.showLoader = false;
            uploader.onAfterAddingFile = function (item) {
                $scope.showLoader = true;
            };
            uploader.onCompleteItem = function (item) {
                uploader.removeFromQueue(item);
            };
            uploader.onSuccessItem = function (item, response, status, header) {
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
            //$scope.oneAtATime = true;
            //$scope.status = {
            //    isFirstOpen: true,
            //    isFirstDisabled: false
            //};

            $scope.addBreak = function(day){
                var gap = {
                    start:moment().hour(12).minute(0).format(),
                    end:moment().hour(13).minute(0).format()
                };
                day.gaps.push(gap);
            };

            $scope.hstep = 1;
            $scope.mstep = 15;
            $scope.ismeridian = true;
            $scope.toggleMode = function() {
                $scope.ismeridian = ! $scope.ismeridian;
            };
            if(!$rootScope.currentUser.user.availability){
                $rootScope.currentUser.user.availability = {
                    Monday:{
                        day:'Monday',
                        start:moment().hour(6).minute(0).format(),
                        end:moment().hour(19).minute(0).format(),
                        gaps:[],
                        available:true
                    },
                    Tuesday:{
                        day:'Tuesday',
                        start:moment().hour(6).minute(0).format(),
                        end:moment().hour(19).minute(0).format(),
                        gaps:[],
                        available: true
                    },
                    Wednesday:{
                        day:'Wednesday',
                        start:moment().hour(6).minute(0).format(),
                        end:moment().hour(19).minute(0).format(),
                        gaps:[],
                        available: true
                    },
                    Thursday:{
                        day:'Thursday',
                        start:moment().hour(6).minute(0).format(),
                        end:moment().hour(19).minute(0).format(),
                        gaps:[],
                        available: true
                    },
                    Friday:{
                        day:'Friday',
                        start:moment().hour(6).minute(0).format(),
                        end:moment().hour(19).minute(0).format(),
                        gaps:[],
                        available: true
                    },
                    Saturday:{
                        day:'Saturday',
                        start:moment().hour(6).minute(0).format(),
                        end:moment().hour(19).minute(0).format(),
                        gaps:[],
                        available: true
                    },
                    Sunday:{
                        day:'Sunday',
                        start:moment().hour(6).minute(0).format(),
                        end:moment().hour(19).minute(0).format(),
                        gaps:[],
                        available: true
                    }
                };
            }
            $scope.showDone = false;
            $scope.updateAvailability = function(availability){
                $scope.showLoading = true;
              user.updateAvailability(availability)
                  .then(function(data){
                      auth.saveToken(data.token);
                      $scope.showLoading = false;
                      $scope.showDone = true;
                  });
            };
            $scope.authorizeInstagram = function(){
                OAuth.popup('instagram')
                    .done(function(result) {
                        result.get('/me')
                            .done(function (response) {
                                //this will display "John Doe" in the console
                                console.log(response.name);
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
            }
        }]);