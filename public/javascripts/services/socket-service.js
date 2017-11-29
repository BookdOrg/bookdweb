/*
 * Created by: Khalil Brown
 *
 */
module.exports = function (socketFactory, remotePort, remoteHost) {
    var myIoSocket = io.connect(remoteHost + ':' + remotePort, {secure:true});
    var mySocket = socketFactory({
        ioSocket: myIoSocket
    });
    mySocket.forward('error');
    return mySocket;
};