function generateChartData(time,indicator) {
  const timeSeries = [];
  let dataPoint = {}
  for (const key in time) {
    dataPoint = {time: time[key] , value : indicator[key]}
    timeSeries.push(dataPoint);
  }
  return timeSeries ;
}

function darkMode(chart){
    let darkMode = {
        width: $(chart).width() -10,
        height: $(chart).height() -10,
          layout: {
        backgroundColor: '#253248',
        textColor: 'rgba(255, 255, 255, 0.9)',
      },
      grid: {
        vertLines: {
          color: '#334158',
        },
        horzLines: {
          color: '#334158',
        },
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
      },
      priceScale: {
        borderColor: '#485c7b',
      },
      timeScale: {
        borderColor: '#485c7b',
                    timeVisible: true,
            secondsVisible: false,
      },
    }
return darkMode
}

const candleStickColors = {
      upColor: '#4bffb5',
      downColor: '#ff4976',
      borderDownColor: '#ff4976',
      borderUpColor: '#4bffb5',
      wickDownColor: '#838ca1',
      wickUpColor: '#838ca1',
      priceFormat: {
    minMove: 0.0000001,
    precision: 7,
		},
    }

const chartOptions = {
	layout: {
		textColor: 'red',
		background: { type: 'solid', color: 'grey' },
	},
};

 renderChart = async (market, symbol) => {
    var end_point;
    var priceFormatted = '';
    _symbol = symbol;
    let current_chart = ".grid-symbol-chart";
    let yahoo_time_period = {"1m":"1d","5m":"5d"};


    // convert time scale for binance
//    market == 'crypto' ? rs = _b_time_res[rs] : rs;
    //set interval
    const rs = _b_time_res[_time_res];
    //get period for yahoo finanace
    market == 'crypto' ? _period = "NONE" : _period = yahoo_time_period[rs];
    market == 'crypto' ? _round = 2 : _round = 2;


//    console.log("rendering chart with",market,symbol,_b_time_res[_time_res],_period);

    // kill websocket
    if(_interval > 0){
//        console.log("closing interval "+_interval);
        clearInterval(_interval);
     }

    var chart = LightweightCharts.createChart(document.getElementById('chart'), darkMode(current_chart) , chartOptions);

    chart.applyOptions({
            rightPriceScale: {
                scaleMargins: {
                    top: 0.3, // leave some space for the legend
                    bottom: 0.25,
                },
            },
            crosshair: {
                // hide the horizontal crosshair line
                horzLine: {
                    visible: false,
                    labelVisible: false,
                },
            },
            // hide the grid lines
            grid: {
                vertLines: {
                    visible: false,
                },
                horzLines: {
                    visible: false,
                },
            },
        });

        const areaSeries = chart.addAreaSeries({
	topColor: '#2962FF',
	bottomColor: 'rgba(41, 98, 255, 0.28)',
	lineColor: '#2962FF',
	lineWidth: 2,
	crossHairMarkerVisible: false,
        });

        const symbolName = symbol;
        const container = document.getElementById('chart');
        // create ohlc legend
        const legend = document.createElement('div');
        legend.style = `z-index: 12; font-size: 13px; font-family: sans-serif; line-height: 18px; font-weight: 300;`;
        container.appendChild(legend);

        const firstRow = document.createElement('div');
        firstRow.innerHTML = symbol  //+ ' O: '+_candlestick.open.toFixed(2) +' H: '+_candlestick.high.toFixed(2) +' L: '+_candlestick.low.toFixed(2) +' C: '+_candlestick.close.toFixed(2);
        firstRow.style.color = 'white';
        legend.appendChild(firstRow);

        const secondRow = document.createElement('div');
        secondRow.innerHTML = "SMA(10)"
        secondRow.style.color = 'white';
        secondRow.style.display = 'flex';
        legend.appendChild(secondRow);

        chart.subscribeCrosshairMove(param => {
            if (param.time) {
                const data = param.seriesPrices.get(_candleseries);
                const open = data.value !== undefined ? data.value : data.open.toFixed(2);
                const high = data.value !== undefined ? data.value : data.high.toFixed(2);
                const low = data.value !== undefined ? data.value : data.low.toFixed(2);
                const close = data.value !== undefined ? data.value : data.close.toFixed(2);
                priceFormatted = ' O: '+open +' H: '+high +' L: '+low +' C: '+close;
            }
            firstRow.innerHTML = `${symbolName} ${priceFormatted}`;
        });

        chart.timeScale().fitContent();

     _candleseries = chart.addCandlestickSeries( candleStickColors );

//    History
    market == 'stocks' ?  end_point = 'yfStockHistory' :  end_point = 'https://api.binance.com/api/v1/klines?symbol=';
    add_to_log(get_current_date()+' Fetch symbol '+symbol+' quotes');
//    fetch(_URL+'/'+end_point+'?symbol='+symbol+'&interval='+_b_time_res[_time_res]+'&period='+_period)
    fetch(end_point+symbol+'&interval='+_b_time_res[_time_res])
        .then((r) => r.json())
        .then(data => {
                         let chartData =   data.map((d) => ({
                              time: d[0] / 1000,
                              open: d[1] * 1,
                              high: d[2] * 1,
                              low: d[3] * 1,
                              close: d[4] * 1,
                              volume: d[5] * 1,
                            }));
                            _candleseries.setData(chartData)
                // VOLUME
                _volumeSeries = chart.addHistogramSeries({
                        color: '#26a69a',
                        priceFormat: {
                            type: 'volume',
                        },
                        priceScaleId: '', // set as an overlay by setting a blank priceScaleId
                        // set the positioning of the volume series
                        scaleMargins: {
                            top: 0.7, // highest point of the series will be 70% away from the top
                            bottom: 0,
                        },
                    });
                    _volumeSeries.priceScale().applyOptions({
                        scaleMargins: {
                            top: 0.7, // highest point of the series will be 70% away from the top
                            bottom: 0,
                        },
                    });
                      const vol_data = chartData
                        .filter((d) => d.volume)
                        .map((d) => ({ time: d.time, value: d.volume,color: d.close > d.open ? '#4bffb5' : '#ff4976'}));
                      _volumeSeries.setData(vol_data);

                      // add rest of indicators
                    fetch(_URL+'/calc_indicators?indicators='+JSON.stringify(_chart_indicators), {
                                                                  method: 'POST',
                                                                  headers: {
                                                                    'Content-Type': 'application/json',
                                                                  },
                                                                  body: JSON.stringify(chartData),
                                                                })
                    .then(data => data.json())
                    .then(indicator_object =>{
                        chartData.indicators =  indicator_object;
//                        console.log(chartData);
                 //SMA10
                     _sma_series = chart.addLineSeries({ color: '#08f9ee', lineWidth: 1 });
                     const sma_data = generateChartData(chartData.indicators.time,chartData.indicators.ma10)
                      _sma_series.setData(sma_data);

                 //SMA100
                     _sma100_series = chart.addLineSeries({ color: 'yellow', lineWidth: 1 });
                     const sma100_data = generateChartData(chartData.indicators.time,chartData.indicators.ma100)
                      _sma100_series.setData(sma100_data);
//                //RSI
                    _rsi_series = chart.addLineSeries({color: '#ccf102',lineWidth: 1, pane: 1,});
                    const rsi_data = generateChartData(chartData.indicators.time,chartData.indicators.rsi)
                    _rsi_series.setData(rsi_data);

                     })
        })


// run websockets

//        if (market == 'stocks'){
//     // create a virtual websocket for symbol
                  _interval = setInterval(function() {
//                        console.log("updating main chart with",market,symbol,_b_time_res[_time_res],_period);
                            fetch(end_point+symbol+'&interval='+_b_time_res[_time_res])
                            .then((r) => r.json())
                            .then(data => {
                                              let chartData =   data.map((d) => ({
                                              time: d[0] / 1000,
                                              open: d[1] * 1,
                                              high: d[2] * 1,
                                              low: d[3] * 1,
                                              close: d[4] * 1,
                                              volume: d[5] * 1,
                                            }));
                                            // add rest of indicators
                                            fetch(_URL+'/calc_indicators?indicators='+JSON.stringify(_chart_indicators), {
                                                                  method: 'POST',
                                                                  headers: {
                                                                    'Content-Type': 'application/json',
                                                                  },
                                                                  body: JSON.stringify(chartData),
                                                                })
                                            .then(data => data.json())
                                            .then(indicator_object =>{
                                                chartData.indicators =  indicator_object;
                                                const last = Object.keys(indicator_object.time).length-1
//                                                console.log("closing price:",indicator_object.close[last])
//                                                console.log("volume prices:",indicator_object.volume[last])
                                                    _candleseries.update({
                                                    time: indicator_object.time[last],
                                                    open: indicator_object.open[last],
                                                    high: indicator_object.high[last],
                                                    low: indicator_object.low[last],
                                                    close: indicator_object.close[last],
                                                    })
                                                    _volumeSeries.update({
                                                        time:indicator_object.time[last],
                                                        value : indicator_object.volume[last],
                                                        color: indicator_object.close[last] > indicator_object.open[last] ? '#4bffb5' : '#ff4976'
                                                           })
                                                        _sma_series.update({
                                                        time: indicator_object.time[last],
                                                        value : indicator_object.ma10[last],
                                                           })
                                                        _sma100_series.update({
                                                        time: indicator_object.time[last],
                                                        value : indicator_object.ma100[last],
                                                           })
                                                        _rsi_series.update({
                                                        time:indicator_object.time[last],
                                                        value : indicator_object.rsi[last],
                                                           })
 //                // update legend
                                firstRow.innerHTML = symbol + ' O: '+parseFloat(indicator_object.open[last]).toFixed(_round) +' H: '+parseFloat(indicator_object.high[last]).toFixed(_round) +' L: '+parseFloat(indicator_object.low[last]).toFixed(_round) +' C: '+parseFloat(indicator_object.close[last]).toFixed(_round)+'  ('+$("#tf").find("option:selected").text()+')';
                                secondRow.innerHTML = '<h6 style="margin-left:5px"><span style="color:#08f9ee">SMA(10): '+indicator_object.ma10[last].toFixed(2)+'</span><span style="color:yellow">&emsp;SMA(100): '+indicator_object.ma100[last].toFixed(2)+'</span><span style="color:white" >&emsp;Vol: '+ indicator_object.volume[last].toFixed(2)+'</span><span style="color:#ccf102" >&emsp;RSI: '+ indicator_object.rsi[last].toFixed(2)+'</span></h6>'
//                                //update SHARPE chart
                               _highChart_val_a  = indicator_object.sharpe[last];
//                   //update wallet chart
                                if(_inPosition)  {
                                       let qty = _wallet[user].find(x => x.asset === symbol).free;
                                       let current_price = indicator_object.close[last];
                                       let amount  = math.round(current_price * qty,2);
//                                       console.log("Wallet: "+get_current_date()+' Token: '+_symbol+' Value: '+amount)
                                       if (amount != 0){// fix glitch
                                           _lineSeries.update({
                                                time: Math.round((Date.now()/1000),0),
                                                value: amount,
                                             });
                                       };
                                       $("#balance").html("$"+amount);
                                       $("#today_gain").html((amount/(_user_wallet[0][4])*100-100).toFixed(2)+"%");
                                       $("#total_gain").html((amount/(_user_wallet[0][2])*100-100).toFixed(2)+"%");
                                       amount > _init_wallet_amount ? $("#balance").css("color","#52e152"):$("#balance").css("color","#ff0000");
                                     }
                                })
                            })
                }, 2000);
};

//////////////////////////////////    SECONDARY CHART ////////////////////////////////////////////

 renderChartSecondary = async (market, symbol) => {
    let end_point;
    let priceFormatted = '';
    _symbol = symbol;
    // convert time scale for binance
    let current_chart = ".grid-symbol-chart-secondary"
    let yahoo_time_period = {"1m":"1d","5m":"5d"};

//    market == 'crypto' ? rs = _b_time_res[rs] : rs;
    const rs = _b_time_res[_time_res_scnd];
    //get period for yahoo finanace
    market == 'crypto' ? _period = "NONE" : _period = yahoo_time_period[rs];
    market == 'crypto' ? _round = 2 : _round = 2;

//    console.log("rendering secondary chart with",market,symbol,_b_time_res[_time_res_scnd], _period);

    // kill websocket
    if(_intervalSec > 0){
        clearInterval(_intervalSec);
     }

    var chartSec = LightweightCharts.createChart(document.getElementById('chart_secondary'), darkMode(current_chart), chartOptions);

    chartSec.applyOptions({
            rightPriceScale: {
                scaleMargins: {
                    top: 0.3, // leave some space for the legend
                    bottom: 0.25,
                },
            },
            crosshair: {
                // hide the horizontal crosshair line
                horzLine: {
                    visible: false,
                    labelVisible: false,
                },
            },
            // hide the grid lines
            grid: {
                vertLines: {
                    visible: false,
                },
                horzLines: {
                    visible: false,
                },
            },
        });

        const areaSeries = chartSec.addAreaSeries({
            topColor: '#2962FF',
            bottomColor: 'rgba(41, 98, 255, 0.28)',
            lineColor: '#2962FF',
            lineWidth: 2,
            crossHairMarkerVisible: false,
        });

        const symbolName = symbol;
        const container = document.getElementById('chart_secondary');
        // create ohlc legend
        const legend = document.createElement('div');
        legend.style = `z-index: 12; font-size: 13px; font-family: sans-serif; line-height: 18px; font-weight: 300;`;
        container.appendChild(legend);

        const firstRow = document.createElement('div');
        firstRow.innerHTML = symbol  //+ ' O: '+_candlestick.open.toFixed(2) +' H: '+_candlestick.high.toFixed(2) +' L: '+_candlestick.low.toFixed(2) +' C: '+_candlestick.close.toFixed(2);

        legend.appendChild(firstRow);

        const secondRow = document.createElement('div');
//        secondRow.innerHTML = "SMA(10)"
        secondRow.style.color = 'white';
        legend.appendChild(secondRow);
        //append time frame
        $("#chart_secondary").append(_time_frame);
        $("#tfChart").val(_time_res_scnd);
        $('#chart_secondary').css({'position': 'relative'});
        $('#tfChart').css({
            'position': 'absolute',
            'top': '0',
            'right': '65px',
            'z-index': '5'
        });
        firstRow.style.color = 'white';
        firstRow.style.position = 'absolute';
        firstRow.style.top = '5px';
        firstRow.style.right = '200';
        firstRow.style.zIndex = '6';

        chartSec.subscribeCrosshairMove(param => {
//            priceFormatted = ' O: '+_candlestick.open.toFixed(2) +' H: '+_candlestick.high.toFixed(2) +' L: '+_candlestick.low.toFixed(2) +' C: '+_candlestick.close.toFixed(2);
            if (param.time) {
                const data = param.seriesPrices.get(__candleseries);
                const open = data.value !== undefined ? data.value : data.open.toFixed(2);
                const high = data.value !== undefined ? data.value : data.high.toFixed(2);
                const low = data.value !== undefined ? data.value : data.low.toFixed(2);
                const close = data.value !== undefined ? data.value : data.close.toFixed(2);
                priceFormatted = ' O: '+open +' H: '+high +' L: '+low +' C: '+close;
            }
            firstRow.innerHTML = `${symbolName} ${priceFormatted}`;
        });
            chartSec.timeScale().fitContent();
            __candleseries = chartSec.addCandlestickSeries( candleStickColors );

//    History
    market == 'stocks' ?  end_point = 'yfStockHistory' :  end_point = 'https://api.binance.com/api/v1/klines?symbol=';
    fetch(end_point+symbol+'&interval='+_b_time_res[_time_res_scnd])
        .then((r) => r.json())
        .then(data => {
                         let chartData =   data.map((d) => ({
                              time: d[0] / 1000,
                              open: d[1] * 1,
                              high: d[2] * 1,
                              low: d[3] * 1,
                              close: d[4] * 1,
                              volume: d[5] * 1,
                            }));
                            __candleseries.setData(chartData)
                // VOLUME
                __volumeSeries = chartSec.addHistogramSeries({
                        color: '#26a69a',
                        priceFormat: {
                            type: 'volume',
                        },
                        priceScaleId: '', // set as an overlay by setting a blank priceScaleId
                        // set the positioning of the volume series
                        scaleMargins: {
                            top: 0.7, // highest point of the series will be 70% away from the top
                            bottom: 0,
                        },
                    });
                    __volumeSeries.priceScale().applyOptions({
                        scaleMargins: {
                            top: 0.7, // highest point of the series will be 70% away from the top
                            bottom: 0,
                        },
                    });
                      const vol_data = chartData
                        .filter((d) => d.volume)
                        .map((d) => ({ time: d.time, value: d.volume,color: d.close > d.open ? '#4bffb5' : '#ff4976'}));
                      __volumeSeries.setData(vol_data);

                      // add rest of indicators
                    fetch(_URL+'/calc_indicators?indicators='+JSON.stringify(_chart_indicators), {
                                                                  method: 'POST',
                                                                  headers: {
                                                                    'Content-Type': 'application/json',
                                                                  },
                                                                  body: JSON.stringify(chartData),
                                                                })
                    .then(data => data.json())
                    .then(indicator_object =>{
                        chartData.indicators =  indicator_object;
//                        console.log(chartData);
                 //SMA10
                     __sma_series = chartSec.addLineSeries({ color: '#08f9ee', lineWidth: 1 });
                     const sma_data = generateChartData(chartData.indicators.time,chartData.indicators.ma10)
                      __sma_series.setData(sma_data);

                 //SMA100
//                     _sma100_series = chart.addLineSeries({ color: 'yellow', lineWidth: 1 });
//                     const sma100_data = generateChartData(chartData.indicators.time,chartData.indicators.ma100)
//                      _sma100_series.setData(sma100_data);
//                //RSI
//                    __rsi_series = chart.addLineSeries({color: '#ccf102',lineWidth: 1, pane: 1,});
//                    const rsi_data = generateChartData(chartData.indicators.time,chartData.indicators.rsi)
//                    __rsi_series.setData(rsi_data);

                     })
        })


// run websockets

//        if (market == 'stocks'){
//     // create a virtual websocket for symbol
                  _intervalSec = setInterval(function() {
//                        console.log("updating main chart with",market,symbol,_b_time_res[_time_res_scnd],_period);
                            fetch(end_point+symbol+'&interval='+_b_time_res[_time_res_scnd])
                            .then((r) => r.json())
                            .then(data => {
                                              let chartData =   data.map((d) => ({
                                              time: d[0] / 1000,
                                              open: d[1] * 1,
                                              high: d[2] * 1,
                                              low: d[3] * 1,
                                              close: d[4] * 1,
                                              volume: d[5] * 1,
                                            }));
                                            // add rest of indicators
                                            fetch(_URL+'/calc_indicators?indicators='+JSON.stringify(_chart_indicators), {
                                                                  method: 'POST',
                                                                  headers: {
                                                                    'Content-Type': 'application/json',
                                                                  },
                                                                  body: JSON.stringify(chartData),
                                                                })
                                            .then(data => data.json())
                                            .then(indicator_object =>{
                                                chartData.indicators =  indicator_object;
                                                const last = Object.keys(indicator_object.time).length-1
//                                                console.log("closing price:",indicator_object.close[last])
//                                                console.log("volume prices:",indicator_object.volume[last])
                                                    __candleseries.update({
                                                    time: indicator_object.time[last],
                                                    open: indicator_object.open[last],
                                                    high: indicator_object.high[last],
                                                    low: indicator_object.low[last],
                                                    close: indicator_object.close[last],
                                                    })
                                                    __volumeSeries.update({
                                                        time:indicator_object.time[last],
                                                        value : indicator_object.volume[last],
                                                        color: indicator_object.close[last] > indicator_object.open[last] ? '#4bffb5' : '#ff4976'
                                                           })
                                                        __sma_series.update({
                                                        time: indicator_object.time[last],
                                                        value : indicator_object.ma10[last],
                                                           })
//                                                        _sma100_series.update({
//                                                        time: indicator_object.time[last],
//                                                        value : indicator_object.ma100[last],
//                                                           })
//                                                        _rsi_series.update({
//                                                        time:indicator_object.time[last],
//                                                        value : indicator_object.rsi[last],
//                                                           })
//                // update legend
                                firstRow.innerHTML = symbol + ' O: '+parseFloat(indicator_object.open[last]).toFixed(_round) +' H: '+parseFloat(indicator_object.high[last]).toFixed(_round) +' L: '+parseFloat(indicator_object.low[last]).toFixed(_round) +' C: '+parseFloat(indicator_object.close[last]).toFixed(_round);
                                })
                            })
                }, 2000);

//    console.log("fetch symbol history");
//    market == 'stocks' ?  end_point = 'yfStockHistory' :  end_point = 'binancePairHistory';
//    add_to_log(get_current_date()+' Fetch symbol '+symbol+' quotes');
//    fetch(_URL+'/'+end_point+'?symbol='+symbol+'&interval='+_b_time_res[_time_res_scnd]+'&period='+_period)
//        .then((r) => r.json())
//        .then((responseC) => {
////            console.log(responseC)
//            // initialize chart
//            __candleseries.setData([]);
//            __candleseries.setData(responseC);
//              //SMA
//              __sma_series = chartSec.addLineSeries({ color: '#08f9ee', lineWidth: 1 });
//              const sma_data = responseC
//                .filter((d) => d.ma10)
//                .map((d) => ({ time: d.time, value: d.ma10 }));
//                __sma_series.setData([]);
//               __sma_series.setData(sma_data);
//                // VOLUME
//                 __volumeSeries = chartSec.addHistogramSeries({
//                        color: '#26a69a',
//                        priceFormat: {
//                            type: 'volume',
//                        },
//                        priceScaleId: '', // set as an overlay by setting a blank priceScaleId
//                        // set the positioning of the volume series
//                        scaleMargins: {
//                            top: 0.7, // highest point of the series will be 70% away from the top
//                            bottom: 0,
//                        },
//                    });
//                    __volumeSeries.priceScale().applyOptions({
//                        scaleMargins: {
//                            top: 0.7, // highest point of the series will be 70% away from the top
//                            bottom: 0,
//                        },
//                    });
//                      const vol_data = responseC
//                        .filter((d) => d.volume)
//                        .map((d) => ({ time: d.time, value: d.volume,color: d.close > d.open ? '#4bffb5' : '#ff4976'}));
//
//                       __volumeSeries.setData([]);
//                      __volumeSeries.setData(vol_data);
//
//              })

//                  _intervalSec = setInterval(function() {
//                       console.log("update secondary with interval",_b_time_res[_time_res_scnd],_period)
//                        fetch(_URL+'/'+end_point+'?symbol='+symbol+'&interval='+_b_time_res[_time_res_scnd]+'&period='+_period)
//                        .then((r) => r.json())
//                        .then((responseD) => {
//                             try{
////                            console.log("yahoo web socket is running...");
//                             candlestick = responseD[responseD.length - 1];
//                                     if (market == 'stocks'){
//                                             __candleseries.update({
//                                                time: candlestick.time,
//                                                open: candlestick.open,
//                                                high: candlestick.high,
//                                                low: candlestick.low,
//                                                close: candlestick.close,
//                                                volume: candlestick.volume,
//                                                rsi: candlestick.rsi,
//                                                ma10: candlestick.ma10,
//                                              })
//                                     }else{
//                                                        let cur_time = candlestick.time * 1000
//                                                        __candleseries.update({
//                                                        time: candlestick.time,
//                                                            "open": candlestick.open,
//                                                            "high": candlestick.high,
//                                                            "low": candlestick.low,
//                                                            "close": candlestick.close
//                                                           })
//                                                        __volumeSeries.update({
//                                                        time: candlestick.time,
//                                                        value : candlestick.volume,
//                                                        color: candlestick.close > candlestick.open ? '#4bffb5' : '#ff4976'
//                                                           })
//                                                        __sma_series.update({
//                                                        time: candlestick.time,
//                                                        value : candlestick.ma10,
//                                                           })
//        //                                            console.log(cur_time, new Date(cur_time) +'  '+symbol + ' O: '+_candlestick.open.toFixed(5) +' H: '+_candlestick.high.toFixed(5) +' L: '+_candlestick.low.toFixed(5) +' C: '+_candlestick.close.toFixed(5)+' v: '+_candlestick.volume );
//                                            }
//                                  }catch (error){
//                                    console.log("Could not update secondary chart",error);
//                                  }
//                // update legend
//                                firstRow.innerHTML = symbol + ' O: '+parseFloat(candlestick.open).toFixed(_round) +' H: '+parseFloat(candlestick.high).toFixed(_round) +' L: '+parseFloat(candlestick.low).toFixed(_round) +' C: '+parseFloat(candlestick.close).toFixed(_round);
////                                secondRow.innerHTML = '<h6><span style="color:blue">SMA(10): '+candlestick.ma10.toFixed(2)+'</span><span style="color:black" >&emsp;Vol: '+ candlestick.volume.toFixed(2)+'</span></h6>'
//
//                            })
////                firstRow.innerHTML = symbol + ' O: '+_candlestick.open.toFixed(5) +' H: '+_candlestick.high.toFixed(5) +' L: '+_candlestick.low.toFixed(5) +' C: '+_candlestick.close.toFixed(5);
////                secondRow.innerHTML = '<h6><span style="color:blue">SMA(10): '+_candlestick.ma10.toFixed(2)+'</span><span style="color:black" >&emsp;Vol: '+ _candlestick.volume.toFixed(2)+'</span><span style="color:#ccf102" >&emsp;RSI: '+ _candlestick.rsi.toFixed(2)+'</span></h6>'
//                }, 2000);
};

