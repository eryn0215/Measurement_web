/**
 * Created by Eryn_Lin on 2016/7/19.
 */

var mongoose = require('mongoose');


var dBase =module.exports= function(){
    mongoose.connect('mongodb://localhost/test');
    var signaldata = mongoose.model("signaldatatest",{
        instrumentid: String,
        signalname: String,
        value: [Number],
        time:  { type : Date, default: new Date().toISOString()}
});
    dBase.prototype.addSignalData=function (data) {


       var newsignaldata= new signaldata({
           instrumentid: data.instrumentid,
           signalname: data.type,
           value: data.value
       });
        console.log(newsignaldata);

        newsignaldata.save(function (err) {
            if (err) {
                console.log(err);
                return;
            }
            console.log("success");
        })
    };
};

