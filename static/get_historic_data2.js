 /*
-------------------------------------------------------------
Date		: 31-Jul-2018
Version		: 1.0.2
Bug 		: Change suggested portfolio from MSN to Yahoo screener
Function  	: get_tickers_for_market
-------------------------------------------------------------
*/
 function test_history(){
	 
		$.ajax({
				  method: "POST",
				  url: "t.php",
				})
			.done(function(data) {	
			if(data.length < 500) historical_data = false;			
			})

 }


function	get_symbol_historyP(ticker){
	if(historical_data){
	try{
		begin = new Date("2013-01-01");
		end 	= new Date();
//	    var   uri = "http://chart.finance.yahoo.com/table.csv?" +
//            //"g=" + "m" +
//            "&a=" + begin.getUTCMonth() +
//            "&b=" + begin.getUTCDate() +
//            "&c=" + begin.getUTCFullYear() +
//            "&d=" + end.getUTCMonth() +
//            "&e=" + end.getUTCDate() +
//            "&f=" + end.getUTCFullYear() +
//            "&s=" + ticker;
		$.ajax({
				  method: "get",
				  //url: "quotes.php",
				  datatype:'json',
				  url: _URL+"/currentQuote",
				  data: {
							q : ticker
						}
				})
		 .done(function(data) {
						try{
							//var x = JSON.parse(data).filter(Boolean);
							var x = JSON.parse(JSON.parse(data));
							var c_readings = x.chart.result["0"].timestamp.length;
							// map date and close price to a new array
							//var b = initialize_two_dim_array( x.chart.result["0"].timestamp.length , 2);
							var b = initialize_two_dim_array( c_readings , 2);

							x.chart.result[0].timestamp.map(function(el,idx){b._data[idx][0] = el});
							x.chart.result[0].indicators.quote[0].close.map(function(el,idx){b._data[idx][1] = el});
							
							// stable prices
							
							b._data = stable_prices(b._data);
							
														
							//prepare csv_arr global array , holds date and closing balance//  TODO: add volume					
							//csv_arr = b._data.slice(1,x.length).reverse();
								//create_chart_data(csv_arr);
								create_chart_data(b._data); 
								// add to ticker history quotes
								tickers_history_quotes[ticker] = b._data;
								// create normal chart
								symbol_data2(ticker,"chart");
								// test comparison											
											//chart_symbols.push(ticker);
											//tickers_history_quotes[ticker] = chart_arr._data;
											//CompareAssetsChart();
								// end testing
								$("#SearchSymbol").prop('disabled', true);
								if(! $( "#RadioSample" ).prop( "checked" )) $("#add2portfolio").css('visibility', 'visible');
								chart_symbols = [];
								chart_symbols.push(selected_symbol);
						}
						catch(error)
						{							
							//console.log("error in get_historic_data2.get_symbol_historyP line 110");
							dialog('Error',"Can't get historic quotes from webservice.\nPlease try again later." ,BootstrapDialog.TYPE_DANGER);	
							$("#add2portfolio").css('visibility', 'hidden');
							$("#SymbolChart").empty();								
						}
				  });
	}
	catch(e){

					//console.log("error in get_historic_data2.get_symbol_historyP line 109");
					dialog('Error',"Can't get historic quotes from webservice.\nPlease try again later." ,BootstrapDialog.TYPE_DANGER);
					$("#add2portfolio").css('visibility', 'hidden');
					$("#SymbolChart").empty();		
	}
	}//no history date
	else{
		dialog('Webservice Not Available',"Can't get historic quotes from webservice.\nPlease try again later." ,BootstrapDialog.TYPE_INFO);
	}
	
}

function get_symbol_news(ticker){ 

		$.ajax({
				  method: "POST",
				  url: "quotes.php",
				  data: { 
							//url		: uri,
							symbol     : ticker,
							content : "NEWS",
							content_tp : "NA"
						}
				})
		 .done(function(data) {	
		 console.log(data)
		 })
		 
  }

function get_symbol_current_quote5(symbol){ 
  try{
		//var symbols = '["' + symbol + '"]' ;
		//var symbols = array_of_tickers.join('","') ;
		
		$.ajax({
				  method: "get",
				  //url: "quotes.php",
				  datatype:'json',
				  url: _URL+"/currentQuote",
				  data: {
							q : symbol
						}
				})
		 .done(function(data) {					
			//console.log(data);
			
			console.log("get_symbol_current_quote5 - ajax successful");
			
			single_quote_r = data;
			
			if(single_quote_r){
					// current_quote 		= flattenObject(JSON.parse(JSON.parse(single_quote_r[symbol])));
					current_quote = data.quoteSummary.result[0].price
					//var res =  [];
					var div_html = "";// = '<tr><th class="indicator">Indicator</th><th class="value">Value</th></tr>';
					var add2portfolio_btn = '<button id="add2portfolio" type="button" \
											class="btn btn-primary"><i class="glyphicon glyphicon-star"></i> Add to Portfolio</button>';
											
					// define indicators params
					var Name			= current_quote.longName;
					var Symbol 			= current_quote.symbol;
					var LastTradeDate 	= moment.unix(current_quote.regularMarketTime).format("YYYY-MM-DD");
					var LastTradeTime 	= moment.unix(current_quote.regularMarketTime).format("h:mma");
					var LastTradePriceOnly = current_quote.regularMarketPrice.raw;
					var Change 			= current_quote.regularMarketChange.fmt;
					var ChangeinPercent = current_quote.regularMarketChangePercent.fmt;
					var asset_type = current_quote.quoteType;
					var exchange = current_quote.exchange;
					
					
					// add to portfolio if symbol name is not null
					if(Name){	
						reset_quote();
						$(".companyName").text(Name);
						$("#symbol_name").append(company_name + " (" + Symbol + ")");
						$("#exchange_info").append("Type: " + asset_type + ".   Exchange: " + exchange + ", \
						Last Trade: " + moment(LastTradeDate).format("dddd, MMMM Do YYYY") + ", at: " + LastTradeTime);
						if(! $( "#RadioSample" ).prop( "checked" )) $("#add2portfolio").css('visibility', 'visible');
						$("#quote").append(LastTradePriceOnly);
						$("#change").append(" " + ns(Change) + " (" + ChangeinPercent + ")");
						numeral(Change)._value >= 0 ? $("#change").css( "color", "#00cc00" ) : $("#change").css( "color", "red" ) ;

                        var flat_data = flattenObject(data);
						for(var i = 0 ; i < ind_arr.length; i++){   //ind_arr and indicators are constants define in symbols3.js
							div_html = div_html +  '<tr>\
											<td>' + indicators[ind_arr[i]] +  '</td>\
											<td>' + flat_data[ind_arr[i]] + '</td>\
										</tr>';					
						}
						$("#quote_tbl tbody").append(div_html);
						$("#SearchSymbol").prop('disabled', true);
						// SET current quote to full
						current_quote = flattenObject(data)

					}else {
						
						dialog('No quote found', "No current quote found for symbol: " + $("#1").val() ,BootstrapDialog.TYPE_INFO);
						$("#add2portfolio").css('visibility', 'hidden');
						$("#SymbolChart").empty();
					}														
			}
			else{				
						dialog('No quote found', "No current quote found for symbol: " + $("#1").val() ,BootstrapDialog.TYPE_INFO);	
						$("#add2portfolio").css('visibility', 'hidden');
						$("#SymbolChart").empty();							
			}
									
		  }) // end successful ajax .done
  }
  catch(e){	
		//console.log("error in get_historic_data2.get_symbol_current_quote2 line 172");
		dialog('Error',"Can't get currents quotes from webservice.\nPlease try again later." ,BootstrapDialog.TYPE_DANGER);
		$("#add2portfolio").css('visibility', 'hidden');;
		$("#SymbolChart").empty();		  
  }
  
}

function handle_footer(){
	// calculate footer total

	var c_count_tickers		= 	tb1.column(1);
	var c_initial_total		= 	tb1.column(5);
	var c_last_change 		=  tb1.column( 10 );
	var c_last_change_base 	=  tb1.column( 11 );
	var c_total_change 		=  tb1.column( 12 );
	var c_today_change 		=  tb1.column( 13 );
	var c_total 			= tb1.column( 14 );
	var c_total_pctg		= tb1.column( 15 );
	
	if( tbRows > 0 ){
		
			$("#combobox").val()? base_currency = $("#combobox").val(): base_currency = get_table_column(tb1,7)[0];
		
			
			$(tb1.column(0).footer()).text("Count:");
			$(c_count_tickers.footer()).text(tbRows);
		
			if(c_today > 0){
				$( c_last_change.footer() ).html(
					(tbRows===1)?
					ps(c_last_change.data()[0]):
					ps(c_last_change.data().splice(0,tbRows).reduce( function (a,b) {return numeral(a)._value + numeral(b)._value})/c_today)
				)
			}
			else $( c_last_change.footer() ).text("0.00%");
					
			
			if(curr_arr.length == 1){
					$( c_last_change_base.footer() ).html(
						(tbRows===1)?
						CurrFull[curr_arr[0]].symbol + n(c_last_change_base.data()[0]):
						CurrFull[curr_arr[0]].symbol + n(c_last_change_base.data().splice(0,tbRows).reduce( function (a,b) {return numeral(a)._value + numeral(b)._value}))
					);				
			}else $( c_last_change_base.footer() ).html("Multiple Currencies");
			

			
			$( c_total_change.footer() ).html(
				(tbRows===1)?
				ps(c_total_change.data()[0]):
				ps(c_total_change.data().splice(0,tbRows).reduce( function (a,b) {return numeral(a)._value + numeral(b)._value})/tbRows)
			);
			
			$( c_today_change.footer() ).html(
				(tbRows===1)?
				CurrFull[base_currency].symbol + n(c_today_change.data()[0]):
				CurrFull[base_currency].symbol + n(c_today_change.data().splice(0,tbRows).reduce( function (a,b) {return numeral(a)._value + numeral(b)._value}))
			); 
				
				$( c_total.footer() ).html("");
				$( c_total.footer() ).html(
					CurrFull[base_currency].symbol + n(c_total.data().reduce( function (a,b) {return n(numeral(a)._value + numeral(b)._value )})) 
			);
			
				$( c_total_pctg.footer() ).html(
					numeral(c_total_pctg.data().splice(0,tbRows).reduce( function (a,b) {return numeral(a)._value + numeral(b)._value})).format('%0')
			);


    }
	else
	{		
		$( c_last_change.footer() ).html('Average');
		$( c_last_change_base.footer() ).html('NA');
		$( c_total_change.footer() ).html('NA');
		$( c_today_change.footer() ).html('Average');
		$( c_total.footer() ).html('Total');
		$( c_total_pctg.footer() ).html('Total');
	}	
}
/*
        var types = [BootstrapDialog.TYPE_DEFAULT, 
                     BootstrapDialog.TYPE_INFO, 
                     BootstrapDialog.TYPE_PRIMARY, 
                     BootstrapDialog.TYPE_SUCCESS, 
                     BootstrapDialog.TYPE_WARNING, 
                     BootstrapDialog.TYPE_DANGER];
					 */
					 
function dialog(_title,_message, _type){
        BootstrapDialog.show({
			type: _type,
            title: _title,
            message: _message,
            buttons: [{
				label: "Close",
                action: function(dialog){
                    dialog.close();
                }
            }]
        })
	
}	



function get_history2(){
	try
	{
		var new_tickers = []; // hold the tickers which have no history yet
		var array_of_tickers = [];

	////////////////////////////     CURRENT QUOTES ///////////////////////////////////////	
		get_current_quotes5(ticker_list_arr, "quotes");	
		
	///////////////////////////     HISTORY QUOTES /////////////////////////////////////////	
		
		begin = new Date("2013-01-01");
		end 	= new Date();

		new_tickers = $(ticker_list_arr).not(Object.keys(tickers_history_quotes)).get();		
		var array_of_tickers = JSON.stringify(new_tickers);		
		
	// Calling Ajax for concurrent  history	
			if(new_tickers.length){
				console.log ("get_history2: Calling ajax get stock history");
                $.ajax({
                          method: "get",
                          datatype:'json',
                          url: _URL+"/multipleHistoryQuotes",
                          data: {
                                    q : array_of_tickers
                                }
                        })

				  .done(function(data) {
					  console.log ("get_history2: Complete loading  stock history");
//					  console.timeEnd("get_history2");
					try
						{
							promised_m = JSON.parse(data);
							
							// populate ticker history object
							//$.each(ticker_list_arr,function(idx, el){
							$.each(new_tickers,function(idx, el){
								
								var x = promised_m[el];
								var c_readings = x.chart.result["0"].timestamp.length;
								// map date and close price to a new array
								//var b = initialize_two_dim_array( x.chart.result["0"].timestamp.length , 2);
								var b = initialize_two_dim_array( c_readings , 2);

								//x.chart.result[0].timestamp.map(function(el,idx){b._data[idx][0] = moment.unix(el).format("YYYY-MM-DD")});
								x.chart.result[0].timestamp.map(function(el,idx){b._data[idx][0] = el});
								x.chart.result[0].indicators.quote[0].close.map(function(el,idx){b._data[idx][1] = el});
								
								// stable prices
								input_history_quote[el] = b._data;
								b._data = stable_prices(b._data);

								tickers_history_quotes[el] = b._data;
								})
						}
					catch(e)
						{ 
							dialog('Timeout Error',"\nCould not get data from webservice. \n\nPlease try again later." ,BootstrapDialog.TYPE_DANGER);
							$("#buildPortfolio").addClass("btn btn-danger"); 
							$("#buildPortfolio").text("No Portfolio");
							$("#buildPortfolio i").remove()					
						}
						
				  })
			} // end if 

		}//try
		catch(e)
		{
			console.log("error at get history line 295");
			$("#buildPortfolio i").remove();
			dialog('Oops...', e + "\n\nCan't get current quotes from webservice.\nPlease try again later." ,BootstrapDialog.TYPE_DANGER)
		}			  
	}



function create_monthly_array(daily_prices_arr,symbol){ 
	try{
			var date1 =  daily_prices_arr[0][0];
			var date2 =  daily_prices_arr[daily_prices_arr.length - 1][0];
			var temp_arr = []; // holds the months interval
			var price_arr = []; // holds the monthly prices derived from the daily	
			var price;
			
			temp_arr = create_date_range_arr(date1, date2); // create the intervals
			var intervals = temp_arr.length; // number of months between the two dates
			var price_arr = initialize_two_dim_array( intervals , 2);
			
			//build monthly prices
			$.each(temp_arr, function(idx,el){
				// find price in daily prices array which matched the date
						search_month 		= el;
						price 				= daily_prices_arr.find(find_closest_month);
						price_arr._data[idx][0] 	= temp_arr[idx];
						price_arr._data[idx][1] 	= price[1];
						
				// last record populate with last record from daily prices
						if(idx == interval-1){
							price_arr._data[idx][0] = date2;
							price_arr._data[idx][1] = daily_prices_arr[daily_prices_arr - 1][1];
						}	
			})
			
			return price_arr._data;
	}
	catch(e){
				console.log("error in get_historic_data2.create_monthly_array line 348");
				dialog('Error', e + "\n\nCan't get currents quotes from webservice for stock: " + symbol +".\nPlease try again later or remove stock from portfolio." ,BootstrapDialog.TYPE_DANGER);
	}
			
}

function sliceFromDate(element, index, array) {
	//if(element[0] >= portfolio._from_date){ return index} 
	 if(moment(element[0])._d >= moment(begin)._d){ return index} 
	 else {return 0}
}

function sliceToDate(element, index, array) {
	// if(element[0] <= portfolio._to_date){ return index} 
	if(moment(element[0])._d <= moment(end)._d){ return index} 
	 else {return 0}
}



function create_portfolio_obj2(){
	try{
		
		portfolio.info = {}; 
		ticker_quote ={};
		json_quotes = [];
		csv_arr_full = []; // holds the complete range (5 years)
		csv_arr = [] ; // holds slice per user input range
		var remove_tickers = [];
		
			begin = new Date($( "#from_date" ).val());
			end = new Date($( "#to_date" ).val());
		
		monte_carlo_obj = {};
		
		var monthly_prices_arr = [];
	
		$.each(portfolio._ticker_list,function(i,symbol)
		{
			// no more symbol to process
			
			//var data_f = promised[symbol];
			var data_f = tickers_history_quotes[symbol];
			//19-Dec-17: check size of array instead of existance
			////if(data_f){
				if(data_f && data_f.length > 100){
					//var x = JSON.parse(data_f).filter(Boolean);
					// map date and close price to a new array
					
					var c_readings = data_f.length;
					var b = initialize_two_dim_array( c_readings , 2);	
				
					data_f.map(function(el,idx){
							b._data[idx][0] = moment.unix(el[0]).format("YYYY-MM-DD");
							b._data[idx][1] = el[1]
							});
					//data_f.chart.result[0].indicators.quote[0].close.map(function(el,idx){b._data[idx][1] = el});	
									
					//prepare csv_arr global array , holds date and closing balance//  TODO: add volume	
							
					//csv_arr_full = b._data.slice(1,x.length).reverse();	
					
					csv_arr_full = b._data;
					
					b._data = stable_prices(b._data);
					
					// slice full reading to the range selected by user

					var date_idx_from 	= 	csv_arr_full.findIndex(sliceFromDate);
					var date_idx_to 	= 	csv_arr_full.length - csv_arr_full.reverse().findIndex(sliceToDate) + 1;
					csv_arr_full.reverse();
					
					csv_arr = csv_arr_full.slice(date_idx_from, date_idx_to);
				
					//////////////////////////////
					vector_arr = create_vector_arr(csv_arr);
					growth_arr = create_growth_vector_arr(vector_arr);
					//populate structure
					ticker_quote.daily_prices       = csv_arr;
					ticker_quote.Symbol             = symbol;
					ticker_quote.raw_data			= csv_arr_full;
					ticker_quote.prices_arr	        = vector_arr;
					ticker_quote.prices_std         = vector_stdev(vector_arr);
					ticker_quote.prices_mean        = vector_mean(vector_arr);
					ticker_quote.growth_arr         = growth_arr;
					ticker_quote.daily_growth_mean        = vector_mean(growth_arr);
					ticker_quote.daily_growth_std         = vector_stdev(growth_arr);
					ticker_quote.daily_growth_drift       = ticker_quote.daily_growth_mean - (Math.pow(ticker_quote.daily_growth_std,2)/2);
					ticker_quote.daily_growth_count       = growth_arr.length;
					ticker_quote.total_growth       = vector_arr[vector_arr.length - 1] / vector_arr[0] - 1;
					//ticker_quote.t_ratio            = ticker_quote.total_growth / ticker_quote.growth_std;
					//ticker_quote.s_ratio            = ticker_quote.growth_mean / ticker_quote.growth_std ;
					ticker_quote.monte_strike_price = ticker_quote.prices_arr[ticker_quote.prices_arr.length - 1];
					ticker_quote.monte_carlo        =  monte_carlo_simulation(ticker_quote.monte_strike_price,
														ticker_quote.daily_growth_drift,
														ticker_quote.daily_growth_std);											
					

					///////////////// Handle monthly returns ////////////////////////////////////
					monthly_prices_arr = create_monthly_array(csv_arr,symbol);
					
					vector_arr = create_vector_arr(monthly_prices_arr);
					growth_arr = create_growth_vector_arr(vector_arr);
			
					ticker_quote.range_data	        = monthly_prices_arr;
					ticker_quote.range_vector_arr	= vector_arr;
					ticker_quote.range_growth_arr	= growth_arr;

					//monthly indicators
					ticker_quote.growth_mean        = vector_mean(growth_arr);
					ticker_quote.growth_std         = vector_stdev(growth_arr);
					ticker_quote.s_ratio            = (ticker_quote.growth_mean - 0.001) / ticker_quote.growth_std ;
					ticker_quote.t_ratio            = ticker_quote.total_growth / ticker_quote.growth_std;
					ticker_quote.growth_drift       = ticker_quote.growth_mean - (Math.pow(ticker_quote.growth_std,2)/2);
			
					// 19-Dec-17 : remove ticker if sharpe ratio treshold < 0.7
//					if ( ticker_quote.s_ratio >= 0.65 || $("#market_select").val() == "SAMPLE"){
						json_quotes.push(ticker_quote);
						portfolio.info = json_quotes 
//					}
//					else{
//						remove_tickers.push(symbol)
//					};

					//prepare next quote
					delete ticker_quote;
					ticker_quote = {};
					csv_arr = [] ;
					monte_carlo_obj = {}
			}
			else
			{

				remove_tickers.push(symbol)
			}
			
		})//end $.each loop
		
		if(remove_tickers.length > 0){
			//dialog("No Data Found","Could not get data for symbols: " + remove_tickers.join(" , ") + "\nSymbol/s will be removed from portfolio", BootstrapDialog.TYPE_DANGER); 
			remove_ticker_from_portfolio2(remove_tickers);
		}
	}
	catch(error)
	{
		console.log("Create Portfolio Error");
		dialog('Error: ' + symbol, error +"\n\nSymbol will be removed from portfolio" ,BootstrapDialog.TYPE_DANGER);
		//remove_ticker_from_portfolio(symbol)
		
	}
	
	
}


function get_current_quotes5(array_of_tickers, table){

   // var script = document.createElement('script');

    // clean the array
//		array_of_tickers = array_of_tickers.filter(function(n){ return n != undefined });
		var symbols = '["' + array_of_tickers.join('","') + '"]' ;
//		var symbols = array_of_tickers.join('","') ;
		
		console.log("get_current_quotes5: - Calling ajax get latest quotes");

		$.ajax({
				  method: "get",
				  datatype:'json',
				  url: _URL+"/multipleCurrentQuote",
				  data: {
							q : symbols
						}
				})
			.done(function(data) {			
				console.log("get_current_quotes5: - Complete loading latest quotes");
				
				latest_quotes = JSON.parse(data);
			
			// if only one ticker returned, then push result object to latest_quotes
			//--	if (results.query.count === 1){latest_quotes.push(results.query.results.quote)}
			//--	else {latest_quotes = results.query.results.quote};
				
				if(tb1){
					
						hide_pf();
						c_today = 0; // count the number of stocks trade today
						for(i=0; i < tb1.column(1).data().length ; i++){  //important!!!! cell index and html array of tickers are not in sync !!!!

										var symbol = tb1.cell(i,1).data();
										//--var current_quote = $.grep(latest_quotes, function(e){ return e.symbol == symbol; });
										 current_quote 		    = latest_quotes[symbol];
										var LastTradePriceOnly	= current_quote.quoteSummary.result[0].price.regularMarketPrice.raw;
										var Currency 			= current_quote.quoteSummary.result[0].price.currency;
										var ChangeinPercent 	= current_quote.quoteSummary.result[0].price.regularMarketChangePercent.raw;
										var LastTradeDate 		= moment.unix(current_quote.quoteSummary.result[0].price.regularMarketTime).format("YYYY-MM-DD");
										var LastTradeTime		= moment.unix(current_quote.quoteSummary.result[0].price.regularMarketTime).format("h:mma");
										var symbol				= current_quote.quoteSummary.result[0].price.currencySymbol;
										// ILA IS exception
										if (current_quote.quoteSummary.result[0].price.currencySymbol == 'ILA'){
										    symbol = CurrFull[current_quote.quoteSummary.result[0].price.currencySymbol].symbol;
										}
										
										var last_price_f = n(LastTradePriceOnly / numeral(tb1.cell(i,16).data())._value);
										var s = LastTradeDate;
										//tb1.cell(i,17).data().substring(0,tb1.cell(i,17).data().indexOf(" "));

										
										//last price
										tb1.cell(i,8).data(symbol + n(last_price_f));
										
										//total						
										//c:tb1.cell(i,9).data(symbol + 
										//n(numeral(last_price_f)._value * numeral(tb1.cell(i,3).data())._value * numeral(tb1.cell(i,16).data())._value / 100 )
										//);

										tb1.cell(i,9).data(symbol + 
										n(numeral(last_price_f)._value * numeral(tb1.cell(i,3).data())._value / currency_denominator(Currency) )
										);	
										
										//last change
										if (s == moment().format("YYYY-MM-DD")){
											tb1.cell(i,10).data(ps(ChangeinPercent))
										}else{							
											tb1.cell(i,10).data('0.00%');	// no change today
											}
										
										//sum change
										tb1.cell(i,12).data(ps((numeral(tb1.cell(i,9).data())._value / numeral(tb1.cell(i,6).data())._value) - 1 ));
										
										//last trading date
										tb1.cell(i,17).data(LastTradeDate + ' ' + LastTradeTime);
										
										// today change
										//var m_date = moment(s, "YYYY-MM-DD");
										
										if (s == moment().format("YYYY-MM-DD") ){
											c_today++;
											tb1.cell(i,11).data( symbol +
																n( numeral(tb1.cell(i,9).data())._value * numeral(tb1.cell(i,10).data())._value ) 
																);  
										}else{							
											tb1.cell(i,11).data(symbol + '0.00');	// no change today
											}

							}//end for
							
							tb1.draw();	
								
							$("#tblPortfolioM td:nth-child(11)").each(function(){numeral($(this).html())._value >= 0 ? 
								$(this)
									.css("color","green")
									.attr('id', 'flashGreen')
									.addClass('active')
								:$(this)
									.css("color","red")
									.attr('id', 'flashRed')
									.addClass('active')						
								}); 
							
							$("#tblPortfolioM td:nth-child(13)").each(function(){numeral($(this).html())._value >= 0 ? 
								$(this)
									.css("color","green")
									.attr('id', 'flashGreen')
									.addClass('active')
								:$(this)
									.css("color","red")
									.attr('id', 'flashRed')
									.addClass('active')						
								}); 
							
							// Calculate summary
							$('#calcPortfolio').trigger( "click" );	
				}//end if(tb1)		
		
			})
}		

// utility function to get array of history quotes
function get_symbols_history_quotes(){
	
	var array_of_tickers = JSON.stringify(chart_symbols); 
	
		$.ajax({
				  method: "get",
				  datatype:'json',
				  url: _URL+"/multipleHistoryQuotes",
				  data: {
							q : array_of_tickers
						}
				})
			  .done(function(data) {
				  console.log ("get_symbols_history_quotes: Complete loading  stock history");
				try
					{
						var results = JSON.parse(data);
						var symbols;
						
	
						for(symbol in results){
							var data_f = results[symbol]
							if(data_f){
									
									var c_readings = data_f.chart.result["0"].timestamp.length;
									var b = initialize_two_dim_array( c_readings , 2);	
								
									//data_f.chart.result[0].timestamp.map(function(el,idx){b._data[idx][0] = moment.unix(el).format("YYYY-MM-DD")});
									data_f.chart.result[0].timestamp.map(function(el,idx){b._data[idx][0] = el});
									data_f.chart.result[0].indicators.quote[0].close.map(function(el,idx){b._data[idx][1] = el});	
//									console.timeEnd("get_symbols_history_quotes");
									b._data = stable_prices(b._data);									
									tickers_history_quotes[symbol] = b._data
									}
						}// end for
					}// end try
				catch(e)
					{ 
//						dialog('Timeout Error',f"\nCould not get data from webservice. \nError:{e}\nPlease try again later." ,BootstrapDialog.TYPE_DANGER);
						dialog('Timeout Error',e ,BootstrapDialog.TYPE_DANGER);
					}
	
			})
}

function get_tickers_for_market(selected){
	
	var arr = []
	
		$.ajax({
				  method: "POST",
				  url: "suggest_tickers.php",
				  data: { 
							market : selected
						}
				})
			.done(function(data) {		
//19-Dec-17 
// Get ticker from google map
//31-Jul-2018 Get tickers from Yahoo screener	
				var res = JSON.parse(data);
				//suggest_ticker = res.searchresults.map(function(el){return el.ticker + ".L"});
				//console.log("default suggested portfolio: " + suggest_ticker);
		switch(selected){
			case "SAMPLE":
				suggest_ticker = res;
				break;
			case "FTSE":
				//suggest_ticker = res.searchresults.map(function(el){return el.ticker + ".L"});
				//suggest_ticker = res.DataList.map(function(el){return el.Eqsm + ".L"});
				res = res.finance.result[0].quotes;
				suggest_ticker = res.map(function(el){return el.symbol});
				//suggest_ticker = $.unique(suggest_ticker);
				break;
			case "NASDAQ":
				//suggest_ticker = res.searchresults.map(function(el){return el.ticker});
				//suggest_ticker = $.unique(suggest_ticker);
				//suggest_ticker = res.DataList.map(function(el){return el.Eqsm});
				res = res.finance.result[0].quotes;
				suggest_ticker = res.map(function(el){return el.symbol});
				break;
			case "NYSE":
				//suggest_ticker = res.searchresults.map(function(el){return el.ticker});
				//suggest_ticker = $.unique(suggest_ticker);
				//suggest_ticker = res.DataList.map(function(el){return el.Eqsm});
				res = res.finance.result[0].quotes;
				suggest_ticker = res.map(function(el){return el.symbol});				
				break;
			case "FRA":
/* 				suggest_ticker = res.searchresults.map(function(el){return el.ticker + ".F"});
				suggest_ticker = $.unique(suggest_ticker); */
				//suggest_ticker = res.DataList.map(function(el){return el.Eqsm + ".F"});
				res = res.finance.result[0].quotes;
				suggest_ticker = res.map(function(el){return el.symbol});				
				break;
			case "EPA":
/* 				suggest_ticker = res.searchresults.map(function(el){return el.ticker + ".PA"});
				suggest_ticker = $.unique(suggest_ticker); */
				//suggest_ticker = res.DataList.map(function(el){return el.Eqsm + ".PA"});
				res = res.finance.result[0].quotes;
				suggest_ticker = res.map(function(el){return el.symbol});				
				break;
			case "TLV":
/* 				suggest_ticker = res.searchresults.map(function(el){return el.ticker + ".TA"});
				suggest_ticker = $.unique(suggest_ticker); */
				//suggest_ticker = res.DataList.map(function(el){return el.Eqsm + ".TA"});
				res = res.finance.result[0].quotes;
				suggest_ticker = res.map(function(el){return el.symbol});				
				break;				
		};
		
		console.log("Suggested portfolio: " + suggest_ticker);
						
			});
			
}

function get_single_quote_obj(){
			if(single_quote_r.quoteSummary){
				     //symbol = Object.keys(single_quote_r)[0];
					 current_quote 		=  single_quote_r.quoteSummary.result[0].price;
					 symbol  = current_quote.symbol;
					 exchange = 					current_quote.exchange;
					 single_quote.Name			= current_quote.longName;
					 single_quote.Symbol 			= current_quote.symbol;
					 single_quote.LastTradeDate 	= moment.unix(current_quote.regularMarketTime).format("YYYY-MM-DD");
					 single_quote.LastTradeTime 	= moment.unix(current_quote.regularMarketTime).format("h:mma");
					 single_quote.LastTradePriceOnly = current_quote.regularMarketPrice.raw;
					 single_quote.Change 			= current_quote.regularMarketChange.fmt;
					 single_quote.ChangeinPercent = current_quote.regularMarketChangePercent.fmt;
					 single_quote.Currency 			= current_quote.currency;
			}	
	
}

function get_Rate_Exchange(pair){
  try
  {
		var symbols = JSON.stringify(pair) ;
		//var symbols = array_of_tickers.join('","') ;
		
		$.ajax({
				  method: "GET",
				  //url: "quotes.php",
				  url: _URL+"/rateExchange",
				  data: {
							q : symbols
						}
				})
		 .done(function(data) {	
			
			var rx_quote = JSON.parse(data);
			var pairs = Object.keys(rx_quote)[0];
			current_rx_quote = rx_quote[pairs];
			

//quote box				  
				var c1 = $( "#f_cur option:selected" ).text();
				var c2 = $("#t_cur option:selected" ).text();
				
				
				
				var title = $("<h5 id='titleRX'><br><b>"+($("#Amount").val()||1)+"</b> "+ c1.substring(0,c1.indexOf(":")-1) +"  to  "+ c2.substring(0,c2.indexOf(":")-1) +"</h5>");				 
				var y = $("<h1 id='rx'>"+ CurrFull[$("#t_cur").val()].symbol + n(numeral($('#Amount').val()||1)._value * current_rx_quote.result[0].price.regularMarketPrice.raw)+"</h3>");
				var time = $("<p><br>As of: "+ moment.unix(current_rx_quote.result[0].price.regularMarketTime).format('dddd, MMM Do YYYY hh:mma')+"</p>");
				$("#rxDiv").text("");
				$("#rxDiv").append(title).append(y).append(time);
				$("#rxDiv").css("visibility","visible");
					
		  }) // end successful ajax .done
  }
  catch(e){
		dialog('Error', e + "\n\nCan't get rate exchange quotes from webservice.\nPlease try again later." ,BootstrapDialog.TYPE_DANGER);
	  
  }

}

function	get_symbol_hist(ticker){
	if(historical_data){
		$.ajax({
				  method: "get",
				  //url: "quotes.php",
				  datatype:'json',
				  url: _URL+"/historyQuotes",
				  data: {
							q : ticker
						}
				})
		 .done(function(data) {
                console.log(data);
                var x = data;
                var c_readings = x.chart.result["0"].timestamp.length;
                // map date and close price to a new array
                //var b = initialize_two_dim_array( x.chart.result["0"].timestamp.length , 2);
                var b = initialize_two_dim_array( c_readings , 2);

                x.chart.result[0].timestamp.map(function(el,idx){b._data[idx][0] = el});
                x.chart.result[0].indicators.quote[0].open.map(function(el,idx){b._data[idx][1] = el});
                x.chart.result[0].indicators.quote[0].high.map(function(el,idx){b._data[idx][2] = el});
                x.chart.result[0].indicators.quote[0].close.map(function(el,idx){b._data[idx][3] = el});
                x.chart.result[0].indicators.quote[0].low.map(function(el,idx){b._data[idx][4] = el});
                x.chart.result[0].indicators.quote[0].volume.map(function(el,idx){b._data[idx][5] = el});

                // stable prices

                b._data = stable_prices(b._data);

                //prepare csv_arr global array , holds date and closing balance//
                //csv_arr = b._data.slice(1,x.length).reverse();
                    //create_chart_data(csv_arr);
                    create_chart_data(b._data);
                    // add to ticker history quotes
                    tickers_history_quotes[ticker] = b._data;
                    // create normal chart
                    symbol_data2(ticker,"chart");
                    // test comparison
                                //chart_symbols.push(ticker);
                                //tickers_history_quotes[ticker] = chart_arr._data;
                                //CompareAssetsChart();
                    // end testing
                    $("#SearchSymbol").prop('disabled', true);
                    if(! $( "#RadioSample" ).prop( "checked" )) $("#add2portfolio").css('visibility', 'visible');;
                    chart_symbols = [];
                    chart_symbols.push(selected_symbol);
		 })
        }
}

function get_crypto_history(pair){
  try
  {
//		var symbols = JSON.stringify(pair) ;
		//var symbols = array_of_tickers.join('","') ;
		symbol = pair

		$.ajax({
				  method: "GET",
				  //url: "quotes.php",
				  url: _URL+"/binance_pair_history",
				  data: {
							q : symbol
						}
				})
		 .done(function(data) {
//                console.log(data)
                let candles = JSON.parse(data)
                algo_chart(symbol,"chart",candles)
		  }) // end successful ajax .done
  }
  catch(e){
		dialog('Error', e + "\n\nCan't get crypto currency history." ,BootstrapDialog.TYPE_DANGER);

  }

}

// return list of us stocks/crypto
async function populate_tickers_dropdown(){
  try
  {
		 $.ajax({
				  method: "GET",
				  //url: "quotes.php",
				  url: _URL+"/get_assets",
				  data: {
							q : _asset
						},
			      success: await function(data){
//                     console.log(JSON.parse(data));
                       _asset_list = JSON.parse(data)
                       $('#tickers').empty();
                       $('#algo_tickers').empty();
                        for ( var key in _asset_list ) {
                            $("#tickers").append("<option value="+_asset_list[key]+">"+key+"</option>")
                        }
//                        $('#tickers').selectpicker("refresh");
//                        $('#algo_tickers').selectpicker("refresh");
                       }
				})
  }
  catch(e){
		dialog('Error', e + "\n\nCan't asset list" ,BootstrapDialog.TYPE_DANGER);
  }
}

async function get_current_stock_quote(symbol){
    try{
		$.ajax({
				  method: "get",
				  //url: "quotes.php",
				  datatype:'json',
				  url: _URL+"/currentQuote",
				  data: {
							q : symbol
						},
                  success: await function(data){
                    _quote = data
                  }
				})
    }
    catch(error){
        dialog('Error',error+"\nCan't get quote from server quotes from webservice.\nPlease try again later." ,BootstrapDialog.TYPE_DANGER);
        }
}
