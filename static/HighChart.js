function update_chart(chart_id,value){
//                console.log("updating chart:"+chart_id+" with value:"+value);
                let chart = Highcharts.charts[chart_id];
                if (chart && !chart.renderer.forExport) {
                    const point = chart.series[0].points[0],
                          inc = parseFloat(value).toFixed(2);
                    let newVal =  parseFloat(((parseFloat(inc)+20) * 2.5).toFixed(0));
                    point.update(newVal);
                }
}

renderHighChart = async (symbol,hc_div) => {

  Highcharts.chart(hc_div, {

    chart: {
        type: 'gauge',
        plotBackgroundColor: null,
        plotBackgroundImage: null,
        plotBorderWidth: 0,
        plotShadow: false,
        height: '80%'
    },

    title: {
        text: symbol
    },

    pane: {
        startAngle: -90,
        endAngle: 89.9,
        background: null,
        center: ['50%', '75%'],
        size: '110%'
    },

    // the value axis
    yAxis: {
        min: 0,
        max: 100,
        tickPixelInterval: 72,
        tickPosition: 'inside',
        tickColor: Highcharts.defaultOptions.chart.backgroundColor || '#FFFFFF',
        tickLength: 20,
        tickWidth: 2,
        minorTickInterval: null,
        labels: {
            distance: 20,
            style: {
                fontSize: '14px'
            }
        },
        plotBands: [{
            from: 0,
            to: 33,
            color: '#DF5353', // red
            thickness: 20
        }, {
            from: 34,
            to: 66,
            color: '#DDDF0D', // yellow
            thickness: 20
        }, {
            from: 67,
            to: 100,
            color: '#55BF3B', // green
            thickness: 20
        }]
    },

    series: [{
        name: 'Performance',
        data: [0],
        tooltip: {
            valueSuffix: '%'
        },
        dataLabels: {
            format: '{y}%',
            borderWidth: 0,
            color: (
                Highcharts.defaultOptions.title &&
                Highcharts.defaultOptions.title.style &&
                Highcharts.defaultOptions.title.style.color
            ) || '#333333',
            style: {
                fontSize: '16px'
            }
        },
        dial: {
            radius: '80%',
            backgroundColor: 'gray',
            baseWidth: 12,
            baseLength: '0%',
            rearLength: '0%'
        },
        pivot: {
            backgroundColor: 'gray',
            radius: 6
        }

    }]

});

  //calculate for both main and benchmark symbol

       _interval_highchart = setInterval(() => {
                // set which value to update
                if(hc_div == "tickerHC"){
                    var chart_id = 0;
                    var value = _highChart_val_a;
                    update_chart(chart_id,value)
                }else{
                    try{
                        var chart_id = 1;
                        var rs;
                        _asset == 'crypto' ?  rs = _b_time_res[_time_res] :  rs = _time_res;
                        var sharpe_15,sharpe_5;
                        let myHeaders = new Headers();
                        myHeaders.append('Content-Type', 'application/json');
                        fetch('https://api.binance.com/api/v1/klines?symbol=BTCUSDT&interval='+rs)
//                        , {
//                              mode: 'cors',
//                              headers: {
//                                'Access-Control-Allow-Origin':'*'
//                              }
//                            })
                         .then(response => response.json())
                          .then(data => fetch('http://localhost:5000/calc_sharpe' ,{
                                                                                        method : 'POST',
                                                                                        body: JSON.stringify(data),
                                                                                        headers : myHeaders,
                                                                                        }))
                          .then(response => response.text())
                          //.then(text =>  update_chart(chart_id,text))
                          .then(sharpe =>  update_chart(chart_id,sharpe))
                          .catch(error => console.log(error));
                    }catch(e){console.log("error in calc_sharpe "+e)}
                };
        }, 2000);
};