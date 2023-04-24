const { log, error } = console;

const renderChart = async () => {
  const chartProperties = {
//    width: window.innerWidth,
//    height: window.innerHeight,
    timeScale: {
      timeVisible: true,
      secondsVisible: true,
    },
    watermark: {
    text: "XYZ",
    fontSize: 256,
    color: "rgba(256, 256, 256, 0.1)",
    visible: true
  },
    pane: 0,
  };
//  const domElement = document.getElementById('tvchart');
  const domElement = document.getElementById('chart');
   _algo_chart = LightweightCharts.createChart(domElement, chartProperties);
//  const chart = LightweightCharts.createChart('container', chartProperties);
   _candleseries = _algo_chart.addCandlestickSeries();
   _klinedata = await getData();
  _candleseries.setData(_klinedata);
  //SMA
  _sma_series = _algo_chart.addLineSeries({ color: 'red', lineWidth: 1 });
  _sma_data = _klinedata
    .filter((d) => d.sma)
    .map((d) => ({ time: d.time, value: d.sma }));
  _sma_series.setData(_sma_data);
//  //EMA
  _ema_series = _algo_chart.addLineSeries({ color: 'green', lineWidth: 1 });
  _ema_data = _klinedata
    .filter((d) => d.ema)
    .map((d) => ({ time: d.time, value: d.ema }));
  _ema_series.setData(_ema_data);
  //MARKERS
//  _candleseries.setMarkers(
//    _klinedata
//      .filter((d) => d.long || d.short)
//      .map((d) =>
//        d.long
//          ? {
//              time: d.time,
//              position: 'belowBar',
//              color: 'green',
//              shape: 'arrowUp',
//              text: 'LONG',
//            }
//          : {
//              time: d.time,
//              position: 'aboveBar',
//              color: 'red',
//              shape: 'arrowDown',
//              text: 'SHORT',
//            }
//      )
//  );
  //Volume
     _volume_series = _algo_chart.addHistogramSeries({
    pane: 1,
  });

    _vol_histogram_data = _klinedata
    .filter((d) => d.volume)
    .map((d) => ({
      time: d.time,
      value: d.volume,
      color: d.close > d.open ?   "#26A69A" : "#EF5350",
    }));
  _volume_series.setData(_vol_histogram_data);

  // number of trades
//  _trades_series = _algo_chart.addLineSeries({
//    color: 'black',
//    lineWidth: 1,
//    pane: 1,
//  });
//  _trades_data = _klinedata
//    .filter((d) => d.trades)
//    .map((d) => ({ time: d.time, value: d.trades }));
//  _trades_series.setData(_trades_data);

  //MACD FAST
  _macd_fast_series = _algo_chart.addLineSeries({
    color: 'blue',
    lineWidth: 1,
    pane: 2,
  });
  _macd_fast_data = _klinedata
    .filter((d) => d.macd_fast)
    .map((d) => ({ time: d.time, value: d.macd_fast }));
  _macd_fast_series.setData(_macd_fast_data);
  //MACD SLOW
  _macd_slow_series = _algo_chart.addLineSeries({
    color: 'red',
    lineWidth: 1,
    pane: 2,
  });
  _macd_slow_data = _klinedata
    .filter((d) => d.macd_slow)
    .map((d) => ({ time: d.time, value: d.macd_slow }));
  _macd_slow_series.setData(_macd_slow_data);
  //MACD HISTOGRAM
  _macd_histogram_series = _algo_chart.addHistogramSeries({
    pane: 2,
  });
  _macd_histogram_data = _klinedata
    .filter((d) => d.macd_histogram)
    .map((d) => ({
      time: d.time,
      value: d.macd_histogram,
      color: d.macd_histogram > 0 ?  "#26A69A" : "#EF5350",
    }));
  _macd_histogram_series.setData(_macd_histogram_data);

    //RSI
  _rsi_series = _algo_chart.addLineSeries({
    color: 'purple',
    lineWidth: 1,
    pane: 3,
  });
  _rsi_data = _klinedata
    .filter((d) => d.rsi)
    .map((d) => ({ time: d.time, value: d.rsi }));
  _rsi_series.setData(_rsi_data);

  /// create legend
        const symbolName = 'ETC USD 7D VWAP';

        const container = document.getElementById('symbol');

        const legend = document.createElement('div');
        legend.style = `position: absolute; left: 12px; top: 12px; z-index: 1; font-size: 14px; font-family: sans-serif; line-height: 18px; font-weight: 300;`;
        container.appendChild(legend);

        const firstRow = document.createElement('div');
        firstRow.innerHTML = symbolName;
        firstRow.style.color = 'black';
        legend.appendChild(firstRow);
firstRow.innerHTML = `${symbolName} <strong>thisisatest</strong>`;
//        _algo_chart.subscribeCrosshairMove(param => {
//            let priceFormatted = '';
//            if (param.time) {
//                const data = param.seriesData.get(areaSeries);
//                const price = data.value !== undefined ? data.value : data.close;
//                priceFormatted = price.toFixed(2);
//            }
//            firstRow.innerHTML = `${symbolName} <strong>${priceFormatted}</strong>`;
//        });

//        _algo_chart.timeScale().fitContent();



};

//_algo_chart.timeScale().fitContent();

renderChart();

// Websocket streaming
run_algo('BTCUSDT');
