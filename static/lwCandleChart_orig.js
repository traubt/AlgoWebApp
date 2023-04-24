const chartOptions = {
	layout: {
		textColor: 'red',
		background: { type: 'solid', color: 'white' },
	},

};


 renderChart = async (market, symbol,rs,theme) => {

    var priceFormatted = '';
    var chart = LightweightCharts.createChart(document.getElementById('chart'), {
//        width: 1000,
//        height: 400,
//        layout: {
//            backgroundColor: '#000000',
//            textColor: 'rgba(255, 255, 255, 0.9)',
//        },
//        grid: {
//            vertLines: {
//                color: 'rgba(197, 203, 206, 0.5)',
//            },
//            horzLines: {
//                color: 'rgba(197, 203, 206, 0.5)',
//            },
//        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        },
        priceScale: {
            borderColor: 'rgba(197, 203, 206, 0.8)',
        },
        timeScale: {
            borderColor: 'rgba(197, 203, 206, 0.8)',
            timeVisible: true,
            secondsVisible: false,
        },
    }, chartOptions);

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
        legend.style = `position: absolute; left: 12px; top: 12px; z-index: 1; font-size: 14px; font-family: sans-serif; line-height: 18px; font-weight: 300;`;
        container.appendChild(legend);

        const firstRow = document.createElement('div');
        firstRow.innerHTML = symbol  //+ ' O: '+_candlestick.open.toFixed(2) +' H: '+_candlestick.high.toFixed(2) +' L: '+_candlestick.low.toFixed(2) +' C: '+_candlestick.close.toFixed(2);
        firstRow.style.color = 'black';
        legend.appendChild(firstRow);

        chart.subscribeCrosshairMove(param => {
//            priceFormatted = ' O: '+_candlestick.open.toFixed(2) +' H: '+_candlestick.high.toFixed(2) +' L: '+_candlestick.low.toFixed(2) +' C: '+_candlestick.close.toFixed(2);
            if (param.time) {
                const data = param.seriesPrices.get(_candleseries);
                const open = data.value !== undefined ? data.value : data.open.toFixed(2);
                const high = data.value !== undefined ? data.value : data.high.toFixed(2);
                const low = data.value !== undefined ? data.value : data.low.toFixed(2);
                const close = data.value !== undefined ? data.value : data.close.toFixed(2);
                console.log(open);
                priceFormatted = ' O: '+open +' H: '+high +' L: '+low +' C: '+close;
            }
            firstRow.innerHTML = `${symbolName} ${priceFormatted}`;
//            $("#firstRow").innerHTML = `${symbolName} <strong>${priceFormatted}</strong>`;
        });

        chart.timeScale().fitContent();

     _candleseries = chart.addCandlestickSeries({
        upColor: '#00ff00',
        downColor: '#ff0000',
        borderDownColor: 'rgba(255, 144, 0, 1)',
        borderUpColor: 'rgba(255, 144, 0, 1)',
        wickDownColor: 'rgba(255, 144, 0, 1)',
        wickUpColor: 'rgba(255, 144, 0, 1)',
        priceFormat: {
			minMove: 0.0000001,
			precision: 7,
		},
    });

    console.log("fetch symbol history");
    var end_point = "";
    market == 'stocks' ?  end_point = 'yfStockHistory' :  end_point = 'binancePairHistory';
    add_to_log(get_current_date()+' Fetch symbol '+symbol+' quotes');
    fetch('http://localhost:5000/'+end_point+'?symbol='+symbol+'&interval='+rs+'m&period=10d')
        .then((r) => r.json())
        .then((response) => {
//            console.log(response)
            _candleseries.setData(response);
        })

// run websockets

        if (market == 'stocks'){
     // create a virtual websocket for symbol
                  _interval = setInterval(function() {
                 // close binance socket
                 		if (Object(_binanceSocket).toString() !== '[object Object]'){
		                _binanceSocket.close();
		                };
                        fetch('http://localhost:5000/'+end_point+'?symbol='+symbol+'&interval='+rs+'m&period=1d')
                        .then((r) => r.json())
                        .then((response) => {
                            console.log("yahoo web socket is running...");
                             _candlestick = response[response.length - 1];
                                    _candleseries.update({
                                                            time: _candlestick.time,
                                                            open: _candlestick.open,
                                                            high: _candlestick.high,
                                                            low: _candlestick.low,
                                                            close: _candlestick.close,
                                                            volume: _candlestick.volume,
                                                            rsi: _candlestick.rsi,
                                                            ma10: _candlestick.ma10
                                                        })
                            })
                // update legend prices
                //$('#tickers :selected').text() + '  '+
                firstRow.innerHTML = symbol + ' O: '+_candlestick.open.toFixed(2) +' H: '+_candlestick.high.toFixed(2) +' L: '+_candlestick.low.toFixed(2) +' C: '+_candlestick.close.toFixed(2);
                }, 2000);
        }else{
                // close yahoo websocket
                if(_interval > 0){
                    console.log("closing interval "+_interval);
                    clearInterval(_interval);
                }

                _binanceSocket = new WebSocket("wss://stream.binance.com:9443/ws/"+symbol.toLowerCase()+"@kline_15m");
                _binanceSocket.onmessage = function (event) {
                var message = JSON.parse(event.data);
                 _candlestick = message.k;
                console.log(new Date(_candlestick.t),_candlestick.c)
                _candleseries.update({
                    time: _candlestick.t / 1000,
                    open: _candlestick.o,
                    high: _candlestick.h,
                    low: _candlestick.l,
                    close: _candlestick.c
                })
                // update legend prices
                firstRow.innerHTML = symbol + ' O: '+parseFloat(_candlestick.o).toFixed(2) +' H: '+parseFloat(_candlestick.h).toFixed(2) +' L: '+parseFloat(_candlestick.l).toFixed(2) +' C: '+parseFloat(_candlestick.c).toFixed(2);

            }
        }

};



