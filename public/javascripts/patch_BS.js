/**
 * Created by Eryn_Lin on 2017/9/8.
 */
var socket = io();

$.getScript('//cdnjs.cloudflare.com/ajax/libs/flot/0.8.2/jquery.flot.min.js', function () {
    $.getScript('//cdnjs.cloudflare.com/ajax/libs/flot/0.8.2/jquery.flot.pie.min.js', function () {
        $.getScript('//cdnjs.cloudflare.com/ajax/libs/flot/0.8.2/jquery.flot.resize.min.js', function () {

            var cd = [];
            var cd_label = [];
            var cd_label_count = 0;
            var pointMax = 2000;

            function initial() {

                socket.on('WAVE 32', function (data) {

                    if (data[1].length > 0) {
                        data[1].forEach(function (element) {
                            var eValue = element;//(((element / 255) * 1.8) / 500) * 1000;
                            cd.push(eValue);
                            cd_label.push(++cd_label_count);
                        });
                    }
                    var patchID = document.getElementById("patchID");
                    patchID.innerHTML = data[0] ;
                });
                socket.on('HRV', function (data) {
                    //console.log(data);
                    var HFdata = document.getElementById("HFdata");
                    HFdata.innerHTML = data[2] ;
                    var LFdata = document.getElementById("LFdata");
                    LFdata.innerHTML = data[4] ;
                });

                socket.on('HR', function (data) {
                    //console.log(data);
                    var hrdata = document.getElementById("hrdata");
                    hrdata.innerHTML = data ;
                });
                socket.on('SPO2', function (data) {
                    //console.log("spo2"+data);
                    // var content = "<span>SPO2 :"+msg[0]+"</span><br><span>PUL: "+msg[1]+"</span>";
                    var hrdata = document.getElementById("ID");
                    hrdata.innerHTML = data[0];
                    var spo2_data = document.getElementById("spo2");
                    spo2_data.innerHTML = data[1];
                    var spo2_hr = document.getElementById("HR");
                    spo2_hr.innerHTML = data[2];
                });

            }

            //假資料
            var hrdata = document.getElementById("ID");
            hrdata.innerHTML = "00B60040";
            var spo2_data = document.getElementById("spo2");
            spo2_data.innerHTML = "97";
            var spo2_hr = document.getElementById("HR");
            spo2_hr.innerHTML = "80";

            //血氧頁面
            var gridStyle = {borderColor: '#ddd', borderWidth: 1, hoverable: true, clickable: true};
            var data = [], totalPoints = 200;

            function getRandomData() {

                if (data.length > 0)
                    data = data.slice(1);

                // do a random walk
                while (data.length < totalPoints) {
                    var prev = data.length > 0 ? data[data.length - 1] : 50;
                    var y = prev + Math.random() * 10 - 5;
                    if (y < 0)
                        y = 0;
                    if (y > 100)
                        y = 100;
                    data.push(Math.round(y * 100) / 100);
                }
                // zip the generated y values with the x values
                var res = [];
                for (var i = 0; i < data.length; ++i) {
                    res.push([i, data[i]])
                }
                return res;
            }

            // setup control widget
            var updateInterval = 300;
            $("#updateInterval").val(updateInterval).change(function () {
                var v = $(this).val();
                if (v && !isNaN(+v)) {
                    updateInterval = +v;
                    if (updateInterval < 1)
                        updateInterval = 1;
                    if (updateInterval > 2000)
                        updateInterval = 2000;
                    $(this).val("" + updateInterval);
                }
            });

            // realtime plot
            var options = {
                grid: gridStyle,
                //series:{shadowSize:0,lines:{show:true,fill:true,fillColor:'rgba(40,200,40,.5)'},color:'#5cb85c'},
                series: {
                    shadowSize: 0,
                    lines: {show: true, fill: false},
                    color: '#99bb99'
                },
                yaxis: {min: 0, max: 100},
                xaxis: {show: false},

            };

            var plot = $.plot($("#chart1"), [getRandomData()], options);
            var realTime;

            function update() {
                plot.setData([getRandomData()]);
                plot.draw();
                realTime = setTimeout(update, updateInterval);
            }

            update();

            $("#chart1").bind("plothover", function (event, pos, item) {
                $("#tooltip").remove();
                if (item) {
                    var tooltip = item.series.data[item.dataIndex][1];
                    $('<a href="#" class="tooltip" id="tooltip">' + tooltip + '</a>')
                        .css({
                            top: item.pageY + 5,
                            left: item.pageX + 5
                        })
                        .appendTo("body").fadeIn(200);
                }
            });

            //血氧頁面結束

            function renderChart_hrv() {

                var canvas = document.getElementById('chart2'),
                    ctx = canvas.getContext('2d'),
                    chartConfig = {
                        type: 'line',
                        data: {
                            datasets: [
                                {
                                    borderColor: "#FF6347",
                                    data: [],
                                    fill: false,
                                    pointRadius: 0
                                }
                            ]
                        }
                        ,
                        options: {
                            legend: {
                                display: false
                            },
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        min: 0,
                                        stepSize: 50,
                                        max: 250
                                    }
                                }]
                            },
                            animation: false
                        }
                    };

                // Reduce the animation steps for demo clarity.
                var Chart_HRV = new Chart(ctx, chartConfig);
                var shiftSwitch = false;
                setInterval(function () {
                    // Get a random index point
                    //var indexToUpdate = Math.round(Math.random() * startingData.labels.length);

                    if (cd.length > pointMax) {
                        shiftSwitch = true;
                    } else if (cd.length == 0) {
                        shiftSwitch = false;
                    }
                    if (shiftSwitch) {
                        nshift = cd.length - pointMax;
                        if (nshift < 1) nshift = 25;
                        for (var i = 0; i < nshift; i++) {
                            cd.shift();
                            cd_label.shift();
                        }
                    }
                    Chart_HRV.data.labels = cd_label;
                    Chart_HRV.data.datasets.forEach(function (dataset) {
                        //dataset.data.shift();
                        dataset.data = cd;
                    })
                    ;
                    // Update one of the points in the second dataset
                    Chart_HRV.update();
                }, 500);
            }

            initial();
            renderChart_hrv();



            // renderChart_oximeter();


        })
    })
})


