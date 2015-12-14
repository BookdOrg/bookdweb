/**
 * Created by khalilbrown on 12/14/15.
 */
angular.module('cc.config', [])
    .constant('CLOUDINARY_BASE', 'http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_300,w_300/v')
    .constant('CLOUDINARY_Default', 'http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_300,w_300/v1432411957/profile/placeholder.jpg')
    .constant('localDevHost', 'localhost')
    .constant('devHost', 'dev.bookd.me')
    .constant('devPort', '8112')
    //TODO Move these to a request made from the backend
    //.constant('facebookApi','https://graph.facebook.com/')
    //.constant('googleApi','https://www.googleapis.com/plus/v1/people/')
;
