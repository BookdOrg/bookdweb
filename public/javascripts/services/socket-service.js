/*
 * Created by: Khalil Brown
 *
 */
module.exports = function (socketFactory) {
    var myIoSocket = io.connect('//localhost:3001');
    var mySocket = socketFactory({
        ioSocket: myIoSocket
    });
    mySocket.forward('error');
    return mySocket;
};