/**
 * Created by Jonfor on 9/3/16.
 */
module.exports = function ($scope, auth, businessFactory) {
  $scope.currPage = 1;
  $scope.user = {};
  $scope.finishPageOne = function (type) {
    if (type.toLowerCase() === 'associate') {
      $scope.user.isAssociate = true;
    } else if (type.toLowerCase() === 'owner') {
      $scope.user.businessOwner = true;
    }
  };

  //Watch the query being entered into the places autocomplete field
  $scope.$watch('query', function (newVal, oldVal) {
    if (newVal && newVal !== oldVal) {
      //if it's new and not equal to the oldval update the selectedQuery
      $scope.selectedQuery = $scope.query;
      $scope.displayPhotos = [];
      if (newVal.photos) {
        for (var photoIndex = 0; photoIndex < 3; photoIndex++) {
          if (newVal.photos[photoIndex]) {
            $scope.displayPhotos.push(newVal.photos[photoIndex].getUrl({
              'maxWidth': 100,
              'maxHeight': 100
            }));
          }
        }
      }

    }
    if (!newVal && oldVal) {
      //if there's no new query but there's an old one, set selected equal to the old one
      $scope.selectedQuery = oldVal;
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
   */
  $scope.claim = function (request) {
    var claimRequest = {};
    claimRequest.phoneNumber = request.formatted_phone_number;
    claimRequest.address = request.formatted_address;
    claimRequest.now = moment().format('MMM Do YYYY, h:mm:ss a');
    claimRequest.placesId = request.place_id;
    claimRequest.name = request.name;
    claimRequest.tier = $scope.tier;
  };
};