/**
 * Created by Eryn_Lin on 2016/6/30.
 */

var serial = require('./serial_socket');
//var serial = require('./TCPsocket');
module.exports = function (io) {
    serial.open(io,'\x32');
}