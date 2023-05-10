
 renderChart = async (market, symbol,rs,theme) => {

    var chart = LightweightCharts.createChart(document.getElementById('lwchart'), {

    });

     _candleseries = chart.addCandlestickSeries({
        upColor: '#00ff00',
        downColor: '#ff0000',
        borderDownColor: 'rgba(255, 144, 0, 1)',
        borderUpColor: 'rgba(255, 144, 0, 1)',
        wickDownColor: 'rgba(255, 144, 0, 1)',
        wickUpColor: 'rgba(255, 144, 0, 1)',
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
//                 		if (Object(_binanceSocket).toString() !== '[object Object]'){
//		                _binanceSocket.close();
//		                };
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
                                                            close: _candlestick.close
                                                        })
                            })
                }, 2000);
        }else{
                // close yahoo websocket
                if(_interval > 0){
                    console.log("closing interval "+_interval);
                    clearInterval(_interval);
                }
                _binanceSocket = new WebSocket("wss://stream.binance.com:9443/ws/"+symbol.toLowerCase()+"@kline_"+rs);
                _binanceSocket.onmessage = function (event) {
                var message = JSON.parse(event.data);
                 _candlestick = message.k;
//                console.log(_candlestick)
                _candleseries.update({
                    time: _candlestick.t / 1000,
                    open: _candlestick.o,
                    high: _candlestick.h,
                    low: _candlestick.l,
                    close: _candlestick.c
                })
            }
        }

};



