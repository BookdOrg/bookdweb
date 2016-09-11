/**
 * Created by Jonfor on 1/18/16.
 */
/**
 * Used to allow interpolation of Google's embedded static maps place IDs.
 * Without this filter, Angular throws an error that the embedded source is not explicitly trusted and won't interpolate.
 * @param $sce
 * @returns {Function}
 */
module.exports = function ($sce) {
    return function (query, type) {
        if (type == 'places') {
            return $sce.trustAsResourceUrl(
                'https://www.google.com/maps/embed/v1/place?key=AIzaSyAK1BOzJxHB8pOFmPFufYdcVdAuLr_6z2U&q=place_id:' + query);
        } else {
            return $sce.trustAsResourceUrl(
                'https://www.google.com/maps/embed/v1/place?key=AIzaSyAK1BOzJxHB8pOFmPFufYdcVdAuLr_6z2U&q=' + query);
        }

    };
};