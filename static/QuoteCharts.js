
function sparkChart(symbol,divId){
	
	var chart_arr =[];
	
	chart_arr = initialize_two_dim_array( tickers_history_quotes[symbol].length , 2);					
	tickers_history_quotes[symbol].map(function(el,idx){chart_arr._data[idx][0] =  el[0]*1000});
	tickers_history_quotes[symbol].map(function(el,idx){chart_arr._data[idx][1] = el[1]});

    Highcharts.chart(divId, {
     //  chart: {
     //      zoomType: 'x'
     //  },
        title: {
            text: ""
        },
      xAxis: {
          type: 'datetime'
      },
       yAxis: {
           title: {
               text: 'Price'
           }
       },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1
                    },
                    stops: [
                        [0, Highcharts.getOptions().colors[0]],
                        [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                    ]
                },
                marker: {
                    radius: 2
                },
                lineWidth: 1,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                threshold: null
            }
        },

        series: [{
            type: 'area',
           // name: 'price',
            data: chart_arr._data
        }]
    });
};

function symbol_data2(symbol,divId){
	
	var chart_arr =[];
	
	chart_arr = initialize_two_dim_array( tickers_history_quotes[symbol].length , 2);					
	tickers_history_quotes[symbol].map(function(el,idx){chart_arr._data[idx][0] = el[0]*1000});
	tickers_history_quotes[symbol].map(function(el,idx){chart_arr._data[idx][1] = el[1]});

    // Create the chart
    Highcharts.stockChart(divId, {

        rangeSelector: {
            selected: 1
        },

        title: {
           text: symbol + ' historic prices'
        },

        scrollbar: {
            barBackgroundColor: 'gray',
            barBorderRadius: 7,
            barBorderWidth: 0,
            buttonBackgroundColor: 'gray',
            buttonBorderWidth: 0,
            buttonBorderRadius: 7,
            trackBackgroundColor: 'none',
            trackBorderWidth: 1,
            trackBorderRadius: 8,
            trackBorderColor: '#CCC'
        },

        series: [{
            name: 'Price',
            data: chart_arr._data,
            tooltip: {
                valueDecimals: 2
            }
        }]
    });
}

function rate_exchange_chart(symbol,divId){
	
	var chart_arr =[];
	
	chart_arr = initialize_two_dim_array( two_dim_arr.length , 2);					
	two_dim_arr.map(function(el,idx){chart_arr._data[idx][0] = numeral(moment(el[0]).format("x"))._value}); 
	two_dim_arr.map(function(el,idx){chart_arr._data[idx][1] = el[1]});

    // Create the chart
    Highcharts.stockChart(divId, {

        rangeSelector: {
            selected: 1
        },

        title: {
           text: symbol + ' historic prices'
        },

        scrollbar: {
            barBackgroundColor: 'gray',
            barBorderRadius: 7,
            barBorderWidth: 0,
            buttonBackgroundColor: 'gray',
            buttonBorderWidth: 0,
            buttonBorderRadius: 7,
            trackBackgroundColor: 'none',
            trackBorderWidth: 1,
            trackBorderRadius: 8,
            trackBorderColor: '#CCC'
        },

        series: [{
            name: 'Price',
            data: chart_arr._data,
            tooltip: {
                valueDecimals: 2
            }
        }]
    });
}

function predictionChart(arr1, arr2, ticker ,divId){
	
	//var chart_arr =[];
	//
	//chart_arr = initialize_two_dim_array( tickers_history_quotes[symbol].length , 2);					
	//tickers_history_quotes[symbol].map(function(el,idx){chart_arr._data[idx][0] = el[0]*1000});
	//tickers_history_quotes[symbol].map(function(el,idx){chart_arr._data[idx][1] = el[1]});

    // Create the chart
    Highcharts.stockChart(divId, {

        rangeSelector: {
            selected: 1
        },

        title: {
           text:  ticker + " : Prediction"
        },

        scrollbar: {
            barBackgroundColor: 'gray',
            barBorderRadius: 7,
            barBorderWidth: 0,
            buttonBackgroundColor: 'gray',
            buttonBorderWidth: 0,
            buttonBorderRadius: 7,
            trackBackgroundColor: 'none',
            trackBorderWidth: 1,
            trackBorderRadius: 8,
            trackBorderColor: '#CCC'
        },

        series: [{
            name: 'History',
            data: arr1._data,
            tooltip: {
                valueDecimals: 2
            }
        },
		{
            name: 'Prediction',
            data: arr2._data,
            tooltip: {
                valueDecimals: 2
            }
        }
		]
    });
}

	//--------------   Risk and efficiency gauages
	


// Bring life to the dials
function risk_chart(growth, risk, sratio) {

    var point,
        newVal,
        inc;

    if (chartGrowth) {
        point = chartGrowth.series[0].points[0];
        //inc = Math.round((Math.random() - 0.5) * 100);
        //newVal = point.y + inc;
		//newVal = 6;
        //
        //if (newVal < 0 || newVal > 200) {
        //    newVal = point.y - inc;
        //}
        //
        point.update(growth);
    }

    // Risk
    if (chartRisk) {
        point = chartRisk.series[0].points[0];
        //inc = Math.random() - 0.5;
        //newVal = point.y + inc;
		//newVal = 1;

        //if (newVal < 0 || newVal > 5) {
        //    newVal = point.y - inc;
        //}

        point.update(risk);
    }
	
	//S-ratio
	
    if (chartEfficiency) {
        point = chartEfficiency.series[0].points[0];
        //inc = Math.random() - 0.5;
        //newVal = point.y + inc;
		//newVal = 1.5;

        //if (newVal < 0 || newVal > 5) {
        //    newVal = point.y - inc;
        //}

        point.update(sratio);
    }	
	
};

function create_chart_container_for(ticker, container){

		var chart_container = '<div><h4 class="perfCompany">' + company_name(ticker)  + '</h4></div><div class="row perfDiv"><div class="perfItem col-md-4" id="container-growth-'+ticker  +'" "></div><div class="perfItem col-md-4" id="container-risk-'+ ticker  +'" "></div><div class="perfItem col-md-4" id="container-efficiency-'+ ticker +'" ></div></div>';

		//1. set containters ids
		containerGrowth = "container-growth-" + ticker;
		containerRisk = "container-risk-" + ticker;
		containerEfficiency = "container-efficiency-" + ticker;

		$(container).append(chart_container);
		
		// initialize the charts
		
		 chartGrowth = Highcharts.chart(containerGrowth, Highcharts.merge(gaugeOptions, {
			yAxis: {
				min: -10,
				max: 10,
				title: {
					text: 'Growth'
				}
			},

			credits: {
				enabled: false
			},

			series: [{
				name: 'Growth',
				data: [0],
				dataLabels: {
					format: '<div class="perfReading" ><span style="font-size:25px;color:' +
						((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y:.1f}</span><br/>' +
						   '<span class="perfSubTitle">% Per Month</span></div>'
				},
				tooltip: {
					valueSuffix: '% per/month'
				}
			}]

		}));

		// The Risk gauge
			chartRisk = Highcharts.chart(containerRisk, Highcharts.merge(riskOptions, {
			yAxis: {
				min: 0,
				max: 20,
				title: {
					text: 'Risk'
				}
			},

			series: [{
				name: 'Risk',
				data: [0.1],
				dataLabels: {
					format: '<div class="perfReading" ><span style="font-size:25px;color:' +
						((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y:.1f}</span><br/>' +
						   '<span class="perfSubTitle">% Standard Deviation</span></div>'
				},
				tooltip: {
					valueSuffix: '% Standard Deviation'
				}
			}]

		}));

		// The S-ratio gauge
		 chartEfficiency = Highcharts.chart(containerEfficiency, Highcharts.merge(gaugeOptions, {
			yAxis: {
				min: -5,
				max: 5,
				title: {
					text: 'Efficiency'
				}
			},

			series: [{
				name: 'S-ratio',
				data: [0],
				dataLabels: {
					format: '<div class="perfReading"><span style="font-size:25px;color:' +
						((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y:.1f}</span><br/>' +
						   '<span class="perfSubTitle">Sharpe Ratio</span></div>'
				},
				tooltip: {
					valueSuffix: 'Sharpe Ratio'
				}
			}]

		}));					
	
}

// pie chart portfolio distribution
function portfolio_dist_pie_chart(container,title, data_arr){
			Highcharts.chart(container, {
				chart: {
					plotBackgroundColor: null,
					plotBorderWidth: null,
					plotShadow: false,
					type: 'pie'
				},
				title: {
					text: title
				},
				tooltip: {
					pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
				},
				plotOptions: {
					pie: {
						allowPointSelect: true,
						cursor: 'pointer',
						dataLabels: {
							enabled: true,
							format: '<b>{point.name}</b>: {point.percentage:.1f} %',
							style: {
								color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
							}
						}
					}
				},
				series: [{
					name: 'Symbol',
					colorByPoint: true,
					data : data_arr
			//		data: [{
			//			name: 'Microsoft Internet Explorer',
			//			y: 56.33
			//		}, {
			//			name: 'Chrome',
			//			y: 24.03
			//		}, {
			//			name: 'Firefox',
			//			y: 10.38
			//		}, {
			//			name: 'Safari',
			//			y: 4.77
			//		}, {
			//			name: 'Opera',
			//			y: 0.91
			//		}, {
			//			name: 'Proprietary or Undetectable',
			//			y: 0.2
			//		}]
				}]
			})
}

///////////////////////          Compare between assets  /////////////////////////////////////////


function CompareAssetsChart() {
			
			$.each(chart_symbols,function(idx,el){	

	var chart_arr =[];
	
	chart_arr = initialize_two_dim_array( tickers_history_quotes[el].length , 2);					
	tickers_history_quotes[el].map(function(symbol,i){chart_arr._data[i][0] = symbol[0]*1000});
	tickers_history_quotes[el].map(function(symbol,i){chart_arr._data[i][1] = symbol[1]});

			
				seriesCounter = idx;
				seriesOptions[seriesCounter] = {
					name: el,
					data: chart_arr._data,
				}
			});
		
		createCompareChartPercent();		
		seriesCounter = 0;	
		seriesOptions = [];
}


function createCompareChartPercent() {

    Highcharts.stockChart('chart', {

        rangeSelector: {
            selected: 4
        },

        yAxis: {
            labels: {
                formatter: function () {
                    return (this.value > 0 ? ' + ' : '') + this.value + '%';
                }
            },
            plotLines: [{
                value: 0,
                width: 2,
                color: 'silver'
            }]
        },

        plotOptions: {
            series: {
                compare: 'percent',
                showInNavigator: true
            }
        },

        tooltip: {
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
            valueDecimals: 2,
            split: true
        },

        series: seriesOptions
    });
}

//function algo_chart(symbol,divId,data){
//
//    AlgoChart =  Highcharts.stockChart('container', {
//
//        title: {
//            text: symbol + ' prices'
//        },
//
//        rangeSelector: {
//            buttons: [{
//                type: 'hour',
//                count: 1,
//                text: '1h'
//            }, {
//                type: 'day',
//                count: 1,
//                text: '1D'
//            }, {
//                type: 'all',
//                count: 1,
//                text: 'All'
//            }],
//            selected: 1,
//            inputEnabled: false
//        },
//
//        series: [{
//            name: symbol,
//            type: 'candlestick',
//            data: data,
//            tooltip: {
//                valueDecimals: 2
//            }
//        }]
//    });
//}

function algo_chart(symbol,divId,data){

    const chartOptions = { layout: { textColor: 'black',
                            background: { type: 'solid', color: 'white' } },
                            	grid: {
                                vertLines: {
                                    color: 'rgba(197, 203, 206, 0.5)',
                                },
                                horzLines: {
                                    color: 'rgba(197, 203, 206, 0.5)',
                                },
                            },
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
                            }
                           };
    const chart = LightweightCharts.createChart('container', chartOptions);
    const areaSeries = chart.addAreaSeries({
        lineColor: '#2962FF', topColor: '#2962FF',
        bottomColor: 'rgba(41, 98, 255, 0.28)',
    });

     candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
        wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });

    candlestickSeries.setData(data);
    chart.timeScale().fitContent();

// update price with websocket
//    var binanceSocket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_15m");
//    binanceSocket = new WebSocket("wss://stream.binance.com:9443/ws/"+symbol.toLowerCase()+"@kline_15m");
//    binanceSocket.onmessage = function (event) {
//	var message = JSON.parse(event.data);
//	var candlestick = message.k;
////	console.log(candlestick)
//	candlestickSeries.update({
//		time: candlestick.t / 1000,
//		open: candlestick.o,
//		high: candlestick.h,
//		low: candlestick.l,
//		close: candlestick.c
//	})
//    }

}
