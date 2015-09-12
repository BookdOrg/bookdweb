/**
 * Created by khalilbrown on 9/11/15.
 */
angular.module('cc.config', [])
    .constant('CLOUDINARY_BASE','http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_300,w_300/v')
    .constant('CLOUDINARY_Default','http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_300,w_300/v1432411957/profile/placeholder.jpg')
    .constant('localDevHost','localhost')
    .constant('devHost','dev.bookd.me')
    .constant('devPort','8112')
;
