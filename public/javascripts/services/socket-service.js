/*
 * Created by: Khalil Brown
 *
 */
module.exports = function (socketFactory, remotePort, remoteHost) {
    var myIoSocket;
    if (remotePort !== null) {
        myIoSocket = io.connect(remoteHost + ":" + remotePort, {secure: true});
    } else {
        myIoSocket = io.connect(remoteHost, {secure: true});
    }
    var mySocket = socketFactory({
        ioSocket: myIoSocket
    });
    mySocket.forward('error');
    return mySocket;
};