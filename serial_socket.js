var SerialPort = require("serialport");
var xenon = require('./xenon_decode');
var whiteUIds = ['0403_6001'];

function open(http, tagId) {
    var xb = new xenon(http);
    SerialPort.list(function (err, ports) {
     console.log('ports', ports)
        ports.forEach(function (port) {
            // if (port.pnpId == 'FTDIBUS\\VID_0403+PID_6001+A50415T9A\\0000') {
            var uid = getPortUid(port);
            console.log('uid', uid)
            console.log('indexOf', whiteUIds.indexOf(uid))
            if (whiteUIds.indexOf(uid) > -1) {
                serialPort = new SerialPort.SerialPort(port.comName, {
                    baudrate: 38400,
                    parser: SerialPort.parsers.readline('4bf352ec', 'hex')
                }, false);
            }
        });

        if (typeof serialPort !== 'undefined') {
            serialPort.open(function (error) {
                if (error) {
                    console.log('failed to open: ' + error);
                } else {
                    serialPort.on('data', function (data) {
                        var dataString = '';
                        if (data.length > 0) {
                            dataString += data.toString('hex');
                            // Split collected data by delimiter
                            var parts = dataString;
                                xb.parseData(new Buffer(parts, 'hex'));
                        }
                    });
                    setTimeout(xb.decodePatch, 0);
                    serialPort.write('\x00\x28' + tagId);

                }
            });
        }
    });
}


function getPortUid(port) {
    var uid;
    if (typeof port.pnpId !== 'undefined') {
        var pnpId = port.pnpId;
        var index = pnpId.indexOf('VID_');
        if (index > -1) {
            uid = pnpId.substring(index + 4, index + 8);
        }
        index = pnpId.indexOf('PID_');
        if (index > -1) {
            uid += "_" + pnpId.substring(index + 4, index + 8);
        }

    } else {
        uid = port.vendorId + "_" + port.productId;
    }

    return uid;
}

exports.open = open; //exports.外部引用名稱 = 內部函數名稱