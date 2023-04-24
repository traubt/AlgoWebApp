/*
-------------------------------------------------------------
Date		: 12-Sep-2018
Version		: 1.0.1
Bug 		: Add sector columnt to suggest portfolio
Function  	: get_history_4_suggested2
-------------------------------------------------------------
*/

function get_history_4_suggested2(ticker_list){
	try
	{
		begin = new Date("2013-01-01");
		end 	= new Date();
		var array_of_tickers = JSON.stringify(ticker_list);

	// Calling Ajax for concurrent  history			
				$.ajax({
						  method	: "POST",
						  url		: "mult2.php",
						  data		: 	{ 
											url			: "dummy URL",
											symbols_arr : array_of_tickers					
										}
						})
				  .done(function(data) {
					  console.log ("get_history_4_suggested2: Complete loading  stock history");
					try
						{
							promised_s = JSON.parse(data);
							
							// populate ticker history object
							$.each(ticker_list,function(idx, el){								
									var x = JSON.parse(JSON.parse(promised_s[el]));
									//19-Dec-17: check if there is history
									////if (!x.chart.error){
									if ( !x.chart.error && x.chart.result[0].timestamp){
											var c_readings = x.chart.result["0"].timestamp.length;
											var b = initialize_two_dim_array( c_readings , 2);

											//x.chart.result[0].timestamp.map(function(el,idx){b._data[idx][0] = moment.unix(el).format("YYYY-MM-DD")});
											x.chart.result[0].timestamp.map(function(el,idx){b._data[idx][0] = el});
											x.chart.result[0].indicators.quote[0].close.map(function(el,idx){b._data[idx][1] = el});										
											// stable prices										
											b._data = stable_prices(b._data);						
									tickers_history_quotes[el] = b._data;
									
						
									}
									//else{
									//	//remove from list
									//	console.log("remove " + el + " from list");
									//	ticker_list.splice(idx,1);
									//}								
								})

////uild suggest portfolio
	portfolio_suggest._ticker_list = ticker_list;
	portfolio_suggest._count_tickers = ticker_list.length;
	
	p_type = "suggest";
	//update holders object
	resource_portfolio(1); // reserve portfolio 
	console.log("set resource portfolio to 1 from suggest");
	if(portfolio) portfolio_main = portfolio; // keep temp portfolio
	portfolio = portfolio_suggest;
	promised = promised_s;
	create_portfolio_obj2();
	$("#market").addClass("btn btn-success");
	$("#market").text("Suggest Portfolio");
	$("#market i").remove();
		
	validate_portfolio();
	
		if (portfolio_suggest._count_tickers > 2) {				
				build_portfolio(0);
				// reset portfolio
				portfolio_suggest = portfolio;
				if (portfolio_main) portfolio = portfolio_main;
				dialog('Suggested portfolio', "Recommended portfolio is ready" ,BootstrapDialog.TYPE_INFO)	
				resource_portfolio(0);
						// Display table add if...
					var suggest = [];
					suggest = initialize_two_dim_array(portfolio_suggest._count_tickers + 2, 5);
					var counter = 0;
					suggest._data[0][0]="Company Name";
					suggest._data[0][1]="Symbol";
					suggest._data[0][2]="Growth p/m";
					suggest._data[0][3]="Risk";
					suggest._data[0][4]="Efficiency";
					suggest._data[0][5]="Sector";
					$.each(portfolio_suggest.info,function(idx,obj){
						global[obj.Symbol]?
						suggest._data[idx+1][0]=  global[obj.Symbol]["quoteSummary.result.0.price.shortName"]:
						suggest._data[idx+1][0] ="DON'T KNOW";
						suggest._data[idx+1][1]=obj.Symbol;
						suggest._data[idx+1][2]=p(obj.growth_mean);
						suggest._data[idx+1][3]=p(obj.growth_std);
						suggest._data[idx+1][4]=n(obj.s_ratio);
						suggest._data[idx+1][5]=  global[obj.Symbol]["quoteSummary.result.0.summaryProfile.sector"];						
					});
					//portfolio
					var l = portfolio_suggest._count_tickers;
					suggest._data[l+1][0]="Portfolio";
					suggest._data[l+1][1]="";
					suggest._data[l+1][2]= p(portfolio_suggest._mean);
					suggest._data[l+1][3]= p(portfolio_suggest._std_dev);
					suggest._data[l+1][4]= n(portfolio_suggest._s_Ratio);	
					suggest._data[l+1][5]="";
					inject_table(suggest._data,"#suggest_table");
					$( "#suggest_table tr:last" ).css({ backgroundColor: "yellow", fontWeight: "bolder" });	
		}
		else{
			dialog('Ooops',  "\n Could not find enough tickers." ,BootstrapDialog.TYPE_DANGER);
		}
					
						}
					catch(e)
						{ 
							console.log("error in sugg.js get_history_4_suggested2");
							dialog('Error',"\n Can not get history at this stage." ,BootstrapDialog.TYPE_DANGER);
							if (portfolio_main) portfolio = portfolio_main;
							resource_portfolio(0);				
						}
						
				  })

		}//try
		catch(e)
		{
			console.log("error in sugg.js get_history_4_suggested2 ");
			if (portfolio_main) portfolio = portfolio_main;
		dialog('Oops...', "\n\nCan't get historic quotes from webservice.\nPlease try again later" ,BootstrapDialog.TYPE_DANGER)
		resource_portfolio(0);
		}	

		resource_portfolio(0);		
	}

	
function get_history_4_suggested(ticker_list_arr){
	try
	{
		begin = new Date(begin);
		end 	= new Date();
		var array_of_tickers = JSON.stringify(ticker_list_arr);
	    var   uri = "http://chart.finance.yahoo.com/table.csv?" +
            //"g=" + "m" +
            "&a=" + begin.getUTCMonth() +
            "&b=" + begin.getUTCDate() +
            "&c=" + begin.getUTCFullYear() +
            "&d=" + end.getUTCMonth() +
            "&e=" + end.getUTCDate() +
            "&f=" + end.getUTCFullYear() +
            "&s=" ;

// Calling Ajax for current and history			
		
// get current quotes	
	//console.log("get_history_4_suggested - calling get current_qutoes4");
	//get_current_quotes4(ticker_list_arr);	//  Do i need current date?  remove comment after debugging history below

	console.log("get_history_4_suggested - calling ajax get history quotes"); 
	//console.log("url is: " + uri);
		$.ajax({
				  method	: "POST",
				  url		: "rxHist.php",
				  data		: 	{ 
									url			: uri,
									content		: "stock_history_prices",
									symbols_arr : array_of_tickers					
								}
				})
		  .done(function(dat) {
			  console.log ("get_history_4_suggested: Complete loading table stock history");
			try
				{
					promised_s = JSON.parse(dat);
					portfolio_suggest = {};
					console.log("get_history_4_suggested - got response with size: " + promised_s.length);
					portfolio_suggest._from_date 	= begin;
					portfolio_suggest._to_date		= end;
    
					portfolio_suggest._ticker_list = ticker_list_arr;
					portfolio_suggest._count_tickers = ticker_list_arr.length;
					
					p_type = "suggest";
					//update holders object
					resource_portfolio(1); // reserve portfolio 
					console.log("set resource portfolio to 1 from suggest");
					portfolio = portfolio_suggest;
					promised = promised_s;
					create_portfolio_obj2();
					//$("#market").addClass("btn btn-success");
					$("#market").text("Found!!!");
					$("#market i").remove();
					
					validate_portfolio();
				
					if (portfolio_suggest._count_tickers > 2) {				
							build_portfolio(0);
							// reset portfolio
							portfolio_suggest = portfolio;
							portfolio = {};
							dialog('Suggested portfolio', "Recommended portfolio is ready" ,BootstrapDialog.TYPE_INFO)	
							resource_portfolio(0);
					}	
				}
			catch(e)
				{ 
					console.log("error in sugg.js get_history_4_suggested line 100");
					dialog('Error', e ,BootstrapDialog.TYPE_DANGER);
					resource_portfolio(0);					
				}
				
			})
	}
	catch(error)
	{
			console.log("error in sugg.js get_history_4_suggested line 109 ");
		dialog('Oops...', "\n\nCan't get historic quotes from webservice.\nPlease try again later" ,BootstrapDialog.TYPE_DANGER)
		resource_portfolio(0);
	}
	resource_portfolio(0);
}

// rate exchange history

function get_rateExHistory(ticker_list_arr){
	try
	{
		
	var new_quotes = []; // hold the quotes which have no history yet
	var array_of_quotes = [];
	var rates_return = {};
	var b = [];
	var c_readings;
		
	new_quotes = $(ticker_list_arr).not(Object.keys(currency_history_obj)).get();
	
	var array_of_tickers = JSON.stringify(new_quotes);
	//console.log(array_of_tickers);

	
	// Calling Ajax for rate exchange history
		if(new_quotes.length){
			console.log("get_rateExHisttory - Calling ajax get rate exchange history");  
			$.ajax({
					  method	: "GET",
					  url		: "http://127.0.0.1:5000/multipleRxHistoryQuotes",
					  data		: 	{
										q : array_of_tickers
									}
					})
			  .done(function(dat) {
				try
					{
						var data = JSON.parse(dat);
						
						for(x in data){
							//currency_history_obj[x] = JSON.parse(JSON.parse(data[x]))
								rates_return = data[x];
							
										// build array 
								c_readings = rates_return.chart.result[0].timestamp.length;
								b = initialize_two_dim_array( c_readings , 2);							
								
								rates_return.chart.result[0].timestamp.map(function(el,idx){b._data[idx][0] = moment.unix(el).format("YYYY-MM-DD")});
								rates_return.chart.result[0].indicators.quote[0].close.map(function(el,idx){b._data[idx][1] = el});	
								
								if(x !== "USD") b._data = stable_prices(b._data);
								currency_history_obj[x] = b._data;
							}
								$("#buildPortfolio i").remove();
								$("#buildPortfolio").addClass("btn btn-success");
								$("#buildPortfolio").removeAttr("disabled");
								$("#buildPortfolio").text("Analyse Portfolio");	
								console.log ("get_rateExHisttory: Complete loading rate exchange history");								

					}
				catch(e)
					{ 
					console.log("error in sugg.js get_rateExHistory line 152");
						dialog('Error', "\n\nCan't get historic Exchange-Rate from webservice.\nPlease try again later" ,BootstrapDialog.TYPE_DANGER);				
					}
					
				})
		}// end if
	}//end try
	catch(error)
	{
		console.log("error in sugg.js get_rateExHistory line 160");
		dialog('Oops...', error ,BootstrapDialog.TYPE_DANGER)
	}
}

function get_pairRxHistory(pair){
	try
	{

// Calling Ajax for rate exchange history		
		
	var array_of_tickers = JSON.stringify(pair);
	//console.log(array_of_tickers);
	var rates_return = {};
	var c = [];
	var c_readings;
	
	console.log("get_pairRxHistory - calling ajax get history quotes");  
		$.ajax({
				  method	: "GET",
				  url		: "http://127.0.0.1:5000/rxHistoryQuotes",
				  data		: 	{
									q : array_of_tickers
								}
				})
		  .done(function(dat) {
			  console.log ("get_pairRxHistory: Complete loading rate exchange history");
			try
				{
					var data = JSON.parse(dat);
					
					for(var x in data){
							//currency_history_obj[x] = JSON.parse(JSON.parse(data[x]))
							rates_return = data.chart.result[0];
								// build array 
							c_readings = rates_return.timestamp.length;
							c = initialize_two_dim_array( c_readings , 6);							
							
							rates_return.timestamp.map(function(el,idx){c._data[idx][0] = moment.unix(el).format("YYYY-MM-DD")});
							rates_return.indicators.quote[0].close.map(function(el,idx){c._data[idx][1] = el});
							rates_return.indicators.quote[0].high.map(function(el,idx){c._data[idx][2] = el});
							rates_return.indicators.quote[0].low.map(function(el,idx){c._data[idx][3] = el});
							rates_return.indicators.quote[0].volume.map(function(el,idx){c._data[idx][4] = el});
							rates_return.indicators.quote[0].open.map(function(el,idx){c._data[idx][5] = el});
							
							//b._data = stable_prices(b._data);

							currency_history_obj[x] = c._data;
							
							// prepare for display array
							two_dim_arr = [];
							two_dim_arr = c._data;
							if(tb_rx){
									tb_rx.destroy();
									$("#rxTB").empty();
							}
							
							create_table("_rate_exchange");
							
							//create chart
							$("#rxChart").empty();
							var symbol = rates_return.meta.symbol.substring(0,3) + " " + rates_return.meta.symbol.substring(3,6);
							rate_exchange_chart(symbol,"rxChart");
						
						}

				}
			catch(e)
				{ 
				console.log("error in sugg.js get_pairRxHistory");
					dialog('Error', "\n\nCan't get historic Exchange-Rate from webservice.\nPlease try again later" ,BootstrapDialog.TYPE_DANGER);				
				}
				
			})
	}
	catch(error)
	{
		console.log("error in get_pairRxHistory");
		dialog('Oops...', error ,BootstrapDialog.TYPE_DANGER)
	}
}

 function ajax_current_quotes5(currency_pairs,table){

//		var symbol = currency_pairs[0] ;
//		var symbol = "USDCAD=X" ;
		var symbol = '["' + currency_pairs.join('","') + '"]' ;

		console.log("ajax_current_quotes5: - Calling ajax get currency pair quotes");

		$.ajax({
				  method: "GET",
				  url: "http://127.0.0.1:5000/currencyQuote",
				  data: {
							q : symbol,
						}
				})
			.done(function(data) {
				console.log("ajax_current_quotes5: - Complete loading currency pair quotes");

				single_quote_rx = JSON.parse(data);


//				//calculate total in base currency
				for(var i=0; i < tbRows; i++){
				    if (tb1.cell(i,7).data() == base_currency){
					//change today
					tb1.cell(i,13).data(CurrFull[base_currency].symbol + n( numeral(tb1.cell(i,11).data())._value )).draw();
//					// total change
					tb1.cell(i,14).data(CurrFull[base_currency].symbol + n( numeral(tb1.cell(i,9).data())._value )).draw();
					}else{
					//change today
					tb1.cell(i,13).data(CurrFull[base_currency].symbol + n( numeral(tb1.cell(i,11).data())._value * single_quote_rx[tb1.cell(i,7).data()+base_currency+"=X"].quoteSummary.result[0].price.regularMarketPrice.raw)).draw();
//					// total change
					tb1.cell(i,14).data(CurrFull[base_currency].symbol + n( numeral(tb1.cell(i,9).data())._value * single_quote_rx[tb1.cell(i,7).data()+base_currency+"=X"].quoteSummary.result[0].price.regularMarketPrice.raw)).draw();
					}
				}

				// total porfolio of base currency
				var total= tb1.column( 14 )
						.data()
						.reduce( function (a, b) {
							return numeral(a)._value + numeral(b)._value;
						}, 0 );

				//calculate percentage of symbol
				for(var i=0; i < tbRows; i++){
					tb1.cell(i,15).data(p(numeral(tb1.cell(i,14).data())._value / total)).draw();
				}

				handle_footer();

			})
 }

			

  