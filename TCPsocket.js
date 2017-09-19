/**
 * Created by Eryn_Lin on 2016/7/29.
 */
var net = require('net');
var xenon = require('./xenon_decode');
var HOST = '0.0.0.0';
var PORT = 60;


function tcpopen(http) {
    var xb = new xenon(http);
  var server = net.createServer(function (socket) {
        console.log("server listening on" + HOST + ":" + PORT);


        socket.once("data", function (data) {
            var buf_ack = getAck(data);
            socket.write(buf_ack);

            socket.on("data", function (data) {
                //console.log(data);
                var buf_ack = getAck(data);
                socket.write(buf_ack);

               var dataString = '';
                if (data.length > 0) {
                    dataString += data.toString('hex');
                    // Split collected data by delimiter
                    var parts = dataString;
                        xb.parseData(new Buffer(parts, 'hex'));
                }
            });
            
        });
      
    });
    server.listen(PORT, HOST);
    setTimeout(xb.decodePatch, 0);
}

    function getAck(data) {
        var buf_ack = new Buffer(6);
        buf_ack.write("RECV", "ascii");
        buf_ack.writeInt16BE(data.length, 4);
        return buf_ack;
    } // rxTotx


    exports.tcpopen = tcpopen;