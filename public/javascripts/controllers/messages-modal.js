/**
 * Created by khalilbrown on 11/28/15.
 */

var app = require('angular').module('cc');

module.exports = function ($scope, $uibModalInstance) {
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
};
