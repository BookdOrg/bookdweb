/*
 * Created by: Khalil Brown
 *
 */
module.exports = function (socketFactory, remoteSocketPort, remoteHost) {
    var myIoSocket = io.connect(remoteHost + remoteSocketPort);
    var mySocket = socketFactory({
        ioSocket: myIoSocket
    });
    mySocket.forward('error');
    return mySocket;
};