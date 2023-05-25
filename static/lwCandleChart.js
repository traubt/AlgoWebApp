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



 renderChart = async (market, symbol,rs,theme) => {
    var end_point;
    var priceFormatted = '';
    _symbol = symbol;
    let current_chart = ".grid-symbol-chart"
    // convert time scale for binance

    market == 'crypto' ? rs = _b_time_res[rs] : rs;
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
        legend.appendChild(secondRow);

        chart.subscribeCrosshairMove(param => {
//            priceFormatted = ' O: '+_candlestick.open.toFixed(2) +' H: '+_candlestick.high.toFixed(2) +' L: '+_candlestick.low.toFixed(2) +' C: '+_candlestick.close.toFixed(2);
            if (param.time) {
                const data = param.seriesPrices.get(_candleseries);
                const open = data.value !== undefined ? data.value : data.open.toFixed(2);
                const high = data.value !== undefined ? data.value : data.high.toFixed(2);
                const low = data.value !== undefined ? data.value : data.low.toFixed(2);
                const close = data.value !== undefined ? data.value : data.close.toFixed(2);
                priceFormatted = ' O: '+open +' H: '+high +' L: '+low +' C: '+close;
            }
            firstRow.innerHTML = `${symbolName} ${priceFormatted}`;
//            $("#firstRow").innerHTML = `${symbolName} <strong>${priceFormatted}</strong>`;
        });

        chart.timeScale().fitContent();

     _candleseries = chart.addCandlestickSeries( candleStickColors );

//    console.log("fetch symbol history");

    market == 'stocks' ?  end_point = 'yfStockHistory' :  end_point = 'binancePairHistory';
    add_to_log(get_current_date()+' Fetch symbol '+symbol+' quotes');
    fetch(_URL+'/'+end_point+'?symbol='+symbol+'&interval='+rs)//+'&period=10d')
        .then((r) => r.json())
        .then((response) => {
//            console.log(response)
            _candleseries.setData(response);
              //SMA
              _sma_series = chart.addLineSeries({ color: '#08f9ee', lineWidth: 1 });
              const sma_data = response
                .filter((d) => d.ma10)
                .map((d) => ({ time: d.time, value: d.ma10 }));
              _sma_series.setData(sma_data);
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
                      const vol_data = response
                        .filter((d) => d.volume)
                        .map((d) => ({ time: d.time, value: d.volume,color: d.close > d.open ? '#4bffb5' : '#ff4976'}));
                      _volumeSeries.setData(vol_data);
                //RSI
                   _rsi_series = chart.addLineSeries({
                    color: '#ccf102',
                    lineWidth: 1,
                    pane: 1,
                  });
                  const rsi_data = response
                    .filter((d) => d.rsi)
                    .map((d) => ({ time: d.time, value: d.rsi }));
                  _rsi_series.setData(rsi_data);
              })

// run websockets

//        if (market == 'stocks'){
     // create a virtual websocket for symbol
                  _interval = setInterval(function() {
                 // close binance socket
//                 		if (Object(_binanceSocket).toString() !== '[object Object]'){
//		                _binanceSocket.close();
//		                };

                        fetch(_URL+'/'+end_point+'?symbol='+symbol+'&interval='+rs)
                        .then((r) => r.json())
                        .then((response) => {
//                            console.log("yahoo web socket is running...");
                             _candlestick = response[response.length - 1];
                             if (market == 'stocks'){
                                     _candleseries.update({
                                        time: _candlestick.time,
                                        open: _candlestick.open,
                                        high: _candlestick.high,
                                        low: _candlestick.low,
                                        close: _candlestick.close,
                                        volume: _candlestick.volume,
                                        rsi: _candlestick.rsi,
                                        ma10: _candlestick.ma10,
                                      })
                             }else{
                                                let cur_time = _candlestick.time * 1000
                                                _candleseries.update({
                                                time: _candlestick.time,
                                                    "open": _candlestick.open,
                                                    "high": _candlestick.high,
                                                    "low": _candlestick.low,
                                                    "close": _candlestick.close
                                                   })
                                                _volumeSeries.update({
                                                time: _candlestick.time,
                                                value : _candlestick.volume,
                                                color: _candlestick.close > _candlestick.open ? '#4bffb5' : '#ff4976'
                                                   })
                                                _sma_series.update({
                                                time: _candlestick.time,
                                                value : _candlestick.ma10,
                                                   })
                                                _rsi_series.update({
                                                time: _candlestick.time,
                                                value : _candlestick.rsi,
                                                   })
//                                            console.log(cur_time, new Date(cur_time) +'  '+symbol + ' O: '+_candlestick.open.toFixed(5) +' H: '+_candlestick.high.toFixed(5) +' L: '+_candlestick.low.toFixed(5) +' C: '+_candlestick.close.toFixed(5)+' v: '+_candlestick.volume );
                                    }
                // update legend
                                firstRow.innerHTML = symbol + ' O: '+parseFloat(_candlestick.open) +' H: '+parseFloat(_candlestick.high) +' L: '+parseFloat(_candlestick.low) +' C: '+parseFloat(_candlestick.close)+'  ('+$("#tf").find("option:selected").text()+')';
                                secondRow.innerHTML = '<h6><span style="color:#08f9ee">SMA(10): '+_candlestick.ma10.toFixed(2)+'</span><span style="color:white" >&emsp;Vol: '+ _candlestick.volume.toFixed(2)+'</span><span style="color:#ccf102" >&emsp;RSI: '+ _candlestick.rsi.toFixed(2)+'</span></h6>'
                                //update SHARPE chart
                               _highChart_val_a  = parseFloat(_candlestick.sharpe);


                   //update wallet chart
                                if(_inPosition)  {
                                       let qty = _wallet[user].find(x => x.asset === symbol).free;
                                       let current_price = _candlestick.close;
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
//                firstRow.innerHTML = symbol + ' O: '+_candlestick.open.toFixed(5) +' H: '+_candlestick.high.toFixed(5) +' L: '+_candlestick.low.toFixed(5) +' C: '+_candlestick.close.toFixed(5);
//                secondRow.innerHTML = '<h6><span style="color:blue">SMA(10): '+_candlestick.ma10.toFixed(2)+'</span><span style="color:black" >&emsp;Vol: '+ _candlestick.volume.toFixed(2)+'</span><span style="color:#ccf102" >&emsp;RSI: '+ _candlestick.rsi.toFixed(2)+'</span></h6>'
                }, 2000);
};

//////////////////////////////////    SECONDARY CHART ////////////////////////////////////////////

 renderChartSecondary = async (market, symbol,rs,theme) => {
    let end_point;
    let priceFormatted = '';
    _symbol = symbol;
    let origRs = rs;
    // convert time scale for binance
    let current_chart = ".grid-symbol-chart-secondary"

    market == 'crypto' ? rs = _b_time_res[rs] : rs;
    // kill websocket
    if(_intervalSec > 0){
//        console.log("closing interval "+_interval);
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
        $("#tfChart").val(origRs);
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

//    console.log("fetch symbol history");

    market == 'stocks' ?  end_point = 'yfStockHistory' :  end_point = 'binancePairHistory';
    add_to_log(get_current_date()+' Fetch symbol '+symbol+' quotes');
    fetch(_URL+'/'+end_point+'?symbol='+symbol+'&interval='+rs)//+'&period=10d')
        .then((r) => r.json())
        .then((response) => {
//            console.log(response)
            __candleseries.setData(response);
              //SMA
              __sma_series = chartSec.addLineSeries({ color: '#08f9ee', lineWidth: 1 });
              const sma_data = response
                .filter((d) => d.ma10)
                .map((d) => ({ time: d.time, value: d.ma10 }));
               __sma_series.setData(sma_data);
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
                      const vol_data = response
                        .filter((d) => d.volume)
                        .map((d) => ({ time: d.time, value: d.volume,color: d.close > d.open ? '#4bffb5' : '#ff4976'}));
                      __volumeSeries.setData(vol_data);

              })

// run websockets

//        if (market == 'stocks'){
     // create a virtual websocket for symbol
                  _intervalSec = setInterval(function() {
                 // close binance socket
//                 		if (Object(_binanceSocket).toString() !== '[object Object]'){
//		                _binanceSocket.close();
//		                };

                        fetch(_URL+'/'+end_point+'?symbol='+symbol+'&interval='+rs)
                        .then((r) => r.json())
                        .then((response) => {
//                            console.log("yahoo web socket is running...");
                             candlestick = response[response.length - 1];
                             if (market == 'stocks'){
                                     __candleseries.update({
                                        time: candlestick.time,
                                        open: candlestick.open,
                                        high: candlestick.high,
                                        low: candlestick.low,
                                        close: candlestick.close,
                                        volume: candlestick.volume,
                                        rsi: candlestick.rsi,
                                        ma10: candlestick.ma10,
                                      })
                             }else{
                                                let cur_time = candlestick.time * 1000
                                                __candleseries.update({
                                                time: candlestick.time,
                                                    "open": candlestick.open,
                                                    "high": candlestick.high,
                                                    "low": candlestick.low,
                                                    "close": candlestick.close
                                                   })
                                                __volumeSeries.update({
                                                time: candlestick.time,
                                                value : candlestick.volume,
                                                color: candlestick.close > candlestick.open ? '#4bffb5' : '#ff4976'
                                                   })
                                                __sma_series.update({
                                                time: candlestick.time,
                                                value : candlestick.ma10,
                                                   })
//                                            console.log(cur_time, new Date(cur_time) +'  '+symbol + ' O: '+_candlestick.open.toFixed(5) +' H: '+_candlestick.high.toFixed(5) +' L: '+_candlestick.low.toFixed(5) +' C: '+_candlestick.close.toFixed(5)+' v: '+_candlestick.volume );
                                    }
                // update legend
                                firstRow.innerHTML = symbol + ' O: '+parseFloat(candlestick.open) +' H: '+parseFloat(candlestick.high) +' L: '+parseFloat(candlestick.low) +' C: '+parseFloat(candlestick.close);
//                                secondRow.innerHTML = '<h6><span style="color:blue">SMA(10): '+candlestick.ma10.toFixed(2)+'</span><span style="color:black" >&emsp;Vol: '+ candlestick.volume.toFixed(2)+'</span></h6>'

                            })
//                firstRow.innerHTML = symbol + ' O: '+_candlestick.open.toFixed(5) +' H: '+_candlestick.high.toFixed(5) +' L: '+_candlestick.low.toFixed(5) +' C: '+_candlestick.close.toFixed(5);
//                secondRow.innerHTML = '<h6><span style="color:blue">SMA(10): '+_candlestick.ma10.toFixed(2)+'</span><span style="color:black" >&emsp;Vol: '+ _candlestick.volume.toFixed(2)+'</span><span style="color:#ccf102" >&emsp;RSI: '+ _candlestick.rsi.toFixed(2)+'</span></h6>'
                }, 2000);
};

