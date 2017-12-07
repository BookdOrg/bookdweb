/**
 * Created by khalilbrown on 8/7/16.
 */
var shared = {
    CLOUDINARY_Default: "https://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_300,w_300/v1432411957/profile/placeholder.jpg",
    CLOUDINARY_BASE: "https://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_300,w_300/v",
    facebookApi: "https://graph.facebook.com/",
    oAuthKey: "mPBNkFFrqBA1L6cT0C7og9-xdQM"
};

//
var environments = {
    development: {
        ENV_VARS: shared,
        remoteHost: "localhost",
        remotePort: "8112"
    },
    staging: {
        ENV_VARS: shared,
        remoteHost: "bookd.me",
        remotePort: "3002"
    },
    production: {
        ENV_VARS: shared,
        remoteHost: "bookd.me",
        remotePort: "3002"
    }
};
module.exports = environments;