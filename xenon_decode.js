/**
 * Created by Eryn_Lin on 2016/6/26.
 */

var S = require('string');
var math = require("mathjs");
var http;
//var db = require("./db.js");
//var dbase = new db();

var Xenon_Data = function (server) {
    http = server;
    //events.EventEmitter.call(this);
};


var xenonPatchInfo = {
    0x00: {tag: "0", length: 3, name: "ACTIVE"},
    0xC8: {tag: "H", length: 4, name: "HR"},
    0xCB: {tag: "K", length: 6, name: "TIME"},
    0xD3: {tag: "S", length: 6, name: "START STOP"},
    0xD0: {tag: "P", length: 5, name: "PUSH BUTTON"},
    0xC2: {tag: "B", length: 2, name: "BATTERY"},
    0xCD: {tag: "M", length: 5, name: "MEMORY FULL"},
    0xC4: {tag: "D", length: 24, name: "HRV"},
    0xD4: {tag: "T", length: 3, name: "BT"},
    0xC9: {tag: "I", length: 4, name: "IMPACT"},
    0xC6: {tag: "F", length: 4, name: "FREE FALL"},
    0xE9: {tag: "i", length: 5, name: " "},
    0xE6: {tag: "f", length: 7, name: " "},
    0xB8: {tag: "8", length: 34, name: "WAVE 32"},
    0xD2: {tag: "R", length: 3, name: "RR"},
    0xD7: {tag: "W", length: 66, name: "WAVE 64"},
    0xCF: {tag: "O", length: 4, name: "SPO2_O"},
    0xEF: {tag: "o", length: 3, name: "SPO2_o"},
    0xF2: {tag: "r", length: 7, name: "RESP"},
    0xDA: {tag: "Z", length: 13, name: "AXIS ANGLE"},
    0xCE: {tag: "N", length: 3, name: "RRN"}
};
var global = {
    lastStamp: {},
    parseChunks: []
};
var global_xbQueue = {};
var ID_xbQueue= {};

Xenon_Data.prototype.parseData = function (data) {
    console.log("parse"+data);
    if (checkSum(data) && data.length>6) {
        global.parseChunks = [];
       process.nextTick(function () {
            decodeXenon(data)
        });
    } else {
        global.parseChunks.push(data);
        var size = 0;
        if (global.parseChunks.length > 1) {
            global.parseChunks.forEach(function (element) {
                size += element.length;//size=element.length+size
            });
            var buf = Buffer.concat(global.parseChunks, size);
            if (checkSum(buf)) {
                //console.log(buf);
                process.nextTick(function () {
                    decodeXenon(buf);
                });
                global.parseChunks = [];
            }
        }
    }

}

Xenon_Data.prototype.decodePatch = function () {
    function decode() {
        for (var xbUID in global_xbQueue) {

            var tagByte;
            var flag;
            var patch;
            var pData = [];
            if (global_xbQueue[xbUID].length > 0) {

                tagByte = global_xbQueue[xbUID][0];
                flag = tagByte >> 7;
                if (flag == 0) {
                    patch = xenonPatchInfo[0x00];
                } else {
                    patch = xenonPatchInfo[tagByte];
                }
                if (patch !== undefined) {
                    if (global_xbQueue[xbUID].length >= patch.length) {
                        for (var i = 0; i < patch.length; i++) {
                            pData.push(global_xbQueue[xbUID].shift());
                        }


                        switch (patch.name) {
                            case "WAVE 32":
                                pData.splice(0, 2); // drop tag,  package index
                                var WAVEdata =[xbUID_right,pData];

                                if (http !==null)  http.emit(patch.name, WAVEdata);

                                break;

                            case "HR":
                                hByte = pData[1];
                                lByte = pData[2];
                                var bpm = ((hByte << 8) + lByte) / 10;

                                var data = {}; 
                                data.instrumentid=xbUID;
                                data.type="HR";
                                data.value=bpm;
                                //dbase.addSignalData(data);
                                if (http !==null)  http.emit(patch.name, bpm);
                                break;

                            case "HRV":
                                var RR = (pData[9] << 8) + pData[10];
                                var SD = (pData[11] << 8) + pData[12];
                                var TP = (pData[13] << 8) + pData[14];
                                var VL = (pData[15] << 8) + pData[16];
                                var LF = (pData[17] << 8) + pData[18];
                                var HF = (pData[19] << 8) + pData[20];
                                var WL = (pData[21] << 8) + pData[22];
                                var LFP = (LF / (TP - VL)) * 100;
                                var RRScore = (RR - 792) / 120.843;
                                var SDScore = (math.log(SD) - 6.48) / 0.981;
                                var HFScore = (math.log(HF) - 4.06) / 1.308;
                                var LFScore = (math.log(LF) - 4.6) / 0.981;
                                var LFPScore = (LFP - 47.8) / 16.355;
                                RRScore = scoreConvert(RRScore);
                                SDScore = scoreConvert(SDScore);
                                HFScore = scoreConvert(HFScore);
                                LFScore = scoreConvert(LFScore);
                                LFPScore = scoreConvert(LFPScore);
                                var HRVScore = [RRScore, SDScore, HFScore, LFScore, LFPScore];
                               // console.log(HRVScore);
                                var data = {};
                                data.instrumentid=xbUID;
                                data.type="HRV";
                                data.value=HRVScore;
                                //dbase.addSignalData(data);
                                if (http !==null)  http.emit(patch.name, HRVScore);
                                break;

                            case "SPO2_O":
                                var spo2 = pData[1];
                                var pul = pData[2];
                                if (spo2 > 0 && spo2 < 255) {
                                    var sp = [xbUID, spo2, pul]
                                    console.log(sp);
                                    if (http !==null)  http.emit("SPO2", sp)
                                }
                                break;
                            case "SPO2_o":
                                var spo2 = pData[1];
                                var pul = pData[2];
                                if (spo2 > 0 && spo2 < 255) {
                                    var sp = [xbUID, spo2, pul];
                                    console.log(sp);

                                    if (http !==null)  http.emit("SPO2", sp);
                                }
                                break;
                        }

                    }
                } else {
                    //log("error tag--"+tagByte);
                    global_xbQueue[xbUID].shift();
                }
            }
        }
        setTimeout(decode, 100);
    }


    decode();
    //process.nextTick(this.decodePatch);
}

var xbUID_right=[];
function decodeXenon(data) {
    console.log(data);
    var xb = new xenonData(data);
    var xbUID = xb.deviceId + xb.productId;
    xbUID_right =xb.deviceId_first+xb.deviceId_last+xb.productId;
    if (global.lastStamp[xbUID] !== undefined) {
        var nextIndex = (global.lastStamp[xbUID] + 1) & 0xFF //0~255
        if (xb.stamp == nextIndex) {
            global_xbQueue[xbUID] = global_xbQueue[xbUID].concat(xb.valueData);
        } else {
            console.log('stamp error:' + global.lastStamp[xbUID].toString(16) + '  next stamp:' + nextIndex.toString(16));
        }
        global.lastStamp[xbUID] = xb.stamp;
    } else {
        global_xbQueue[xbUID] = xb.valueData;
        global.lastStamp[xbUID] = xb.stamp;
    }

}

function scoreConvert(score) {
    var ans = 0;
    if (score > 2) {
        ans = (score - 2) * 10 + 90;
    } else if (score <= 2 && score >= -2) {
        ans = score * 20 + 50;
    } else {
        ans = (score + 2) * 10 + 10;
    }

    if (ans > 100) ans = 100;
    if (ans < 0) ans = 0;
    return math.round(ans);


}

function checkSum(data) {
    var sum1 = 0;
    var sum2 = data[data.length - 1];
    for (var i = 0; i < data.length - 1; i++) {
        sum1 += data[i];
    }
    sum1 = sum1 & 0xFF;
    return sum1 == sum2;
}

function xenonData(data) {
    console.log(data);
    var arrayIndex = 0;
    this.productId = S('00' + data[1].toString(16)).right(2).toUpperCase() + S('00' + data[0].toString(16)).right(2).toUpperCase();

    this.stamp = data[2];
    this.deviceId = "";
    var deviceIdLength = (data[3] & 0xE0) >> 5;  //   ex . 0x26 = 001 00110  deviceIdLength = 001=1 , valueDataLength=00110=6
    var valueDataLength = (data[3] & 0x1F);
    for (var i = 1; i < deviceIdLength + 1; i++) {
        arrayIndex = 3 + i;
        this.deviceId += S('00' + data[3 + i].toString(16)).right(2).toUpperCase();
    }
    this.deviceId = S('0000' + this.deviceId).right(4).toString();
    this.deviceId_first=S('0000' + this.deviceId).right(2).toString();
    this.deviceId_last=S('0000' + this.deviceId).substring(4, 6);


    this.valueData = [];
    for (var i = 1; i < valueDataLength + 1; i++) {
        this.valueData.push(data[arrayIndex + i]);
    }
}
module.exports = Xenon_Data;