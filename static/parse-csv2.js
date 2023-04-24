/*
-------------------------------------------------------------
Date		: 4-Sep-2017
Version		: 1.0.1
Bug 		: Remove tikcers from portfolio.info in case there are not enoughh ticker reading
Function  	: remove_ticker_from_portfolio2
-------------------------------------------------------------
Date		: 18-Apr-2018
Version		: 1.0.1
Bug 		: Daily tracking displays huge amount. Solution: Add ILS currency to the divider list
Function  	: currency_denominator
-------------------------------------------------------------
*/

function csv2arr(csv){
    try
    {   
        // output object                        console.timeEnd("Submit");  
        var data = [],
        // output array
        records = [],
		rev_array = [];
        // splits csv data at each new line
        lines = csv.split(/\r\n|\r|\n/),
        // creates columns by splitting first line of csv
        columns = lines[0].split(',');
        // creates objects from csv data if column option included

            // loop through each line of csv file
            for (var l = 1; l <= lines.length-1; l++)
            {
                // splits each line of csv by comma
                var words = lines[l].split(',');
				// select data and adj_close fields
				var symbol_idx = [ 0, 6 ];
                // builds object based on column headers
                for (var cell in symbol_idx)
                {
                //data[columns[symbol_idx[cell]]] = words[symbol_idx[cell]];          
				// pushes object to output array
					data.push(words[symbol_idx[cell]])
				}
                // resets object in order to add another
				records.push(data);
                data = [];
            }

        // returns output array
		
		rev_array = records;

        return (rev_array.reverse()).slice(1);
    }
    catch(err){
		console.log("error at parse-csv2 line 41");
        return err
    }
}

// create subset of history quote with the relevant ticker
function create_ticker_array_from_history(ticker){
	
	slice_ticker_arr = [];
	
	for (i = 0 ; i < tickers_history_quotes.quote.length ; i++){ // go over all history quotes
		if (tickers_history_quotes.quote[i].Symbol === ticker){ // ticker found in array !			
			slice_ticker_arr.push(tickers_history_quotes.quote);		
		}
	}
	return slice_ticker_arr
}

// create an array of closed price
function create_vector_arr(arr){ //,idx){
	
    var j, ncols;

    vector = [];
	ncols = arr.length;

    for (j = 0; j < ncols; j = j + 1) {	
	
			//vector.push(parseFloat(arr[j].Adj_Close))
			vector.push(parseFloat(arr[j][1]))	
        }
    return vector;
		
}

function n(x){
	
	return numeral(x).format('0,0.00');
}

function ns(x){
	
	return numeral(x).format('+0,0.00');
}

function p(x){
	return numeral(x).format('0,0.00%');
}

function ps(x){
	return numeral(x).format('+0,0.00%');
}

function factor10(num1, num2){

	return Math.pow(10,Math.round(Math.log10(num1/num2)))

}

function create_chart_data(arr){ //,idx){
	
    var rows, col;
	
	chart_arr = initialize_two_dim_array(arr.length, 2);
	rows = arr.length;
    for (var j = 0; j < rows; j = j + 1) {	
	
			chart_arr._data[j][0] = moment(arr[j][0]).valueOf(); //date
			chart_arr._data[j][1] = round_to(arr[j][1],1); // open
			chart_arr._data[j][2] = round_to(arr[j][2],1); //high
			chart_arr._data[j][3] = round_to(arr[j][3],1); //close
			chart_arr._data[j][4] = round_to(arr[j][4],1); //low
			chart_arr._data[j][5] = round_to(arr[j][5],1);  //volume
        }		
}

// create an array of returns
function create_growth_vector_arr(vector){
	
		var growth_arr;		
		growth_arr = [];
	
		for (var i = 1; i < vector.length; i++ ){
			
			//growth_arr.push( (vector[i] - vector[i-1]) / vector[i-1] )
                        numeral(growth_arr.push(Math.log(vector[i]/vector[i-1]))).format('0.0000%');
					
		}
		
		return growth_arr
}

function initialize_two_dim_array(cols , rows){

		return math.zeros(cols, rows)
	
/* 	var twoDimensionalArray =[];

		for (var i=0;i<rows;i++)
		{
		  var data = [];
		  for (var j=0;j<cols;j++)
		  {
			data.push(1);
		  }

		  twoDimensionalArray.push(data);

		}

		return twoDimensionalArray; */
}

function create_growth_combine_arr(){	
	for(var row = 0  ; row < portfolio._count_tickers ; row++ ){
		for (var j = 0; j < portfolio.info[0].range_growth_arr.length; j++){
			
			two_dim_arr._data[row][j] = portfolio.info[row].range_growth_arr[j]
			
		}
	} 
}

function create_covariance_arr(){	
	for(var i = 0 ; i < portfolio._count_tickers ; i++ ){
		for (var j = 0; j < portfolio._count_tickers ; j++){
			
			//two_dim_arr._data[i][j] = numeral(covariance(portfolio._returns._data[i], portfolio._returns._data[j])).format("0.0000");
			two_dim_arr._data[i][j] = round_to(covariance(portfolio._returns._data[i], portfolio._returns._data[j]),4);
		}
	} 
}

function create_correlation_arr(){	
	for(var i = 0 ; i < portfolio._count_tickers ; i++ ){
		for (var j = 0; j < portfolio._count_tickers; j++){
			
			two_dim_arr._data[i][j] = numeral(correlation(portfolio._returns._data[i], portfolio._returns._data[j])).format("0.0000");
			
		}
	} 
}

function portfolio_mean_arr(){
	
	var arr = [];
	
	for (var i = 0 ; i < portfolio._returns._data.length ; i++){
		
		arr.push(vector_mean(portfolio._returns._data[i]))
	}
	
	return arr
}

function portfolio_stdev_arr(){
	
	var arr = [];
	
	for (var i = 0 ; i < portfolio._returns._data.length ; i++){
		
		arr.push(vector_stdev(portfolio._returns._data[i]))
	}
	
	return arr
}

function portfolio_mean(x , y){
		
	return math.multiply(x,y);
	
}

function portfolio_stdev(cov , x){
		
	return math.sqrt(math.multiply(math.multiply(cov,x),x));
	
}

function vector_growth(vector){
	
	return (vector[vector.length -1]  - vector[0]) / vector[0];
}

function vector_mean(vector){

	return jStat.mean(vector);	
}

function vector_stdev(vector){

	return jStat.stdev(vector);	
}

function total_ratio(vector){
	
	return vector_growth(vector)/vector_stdev(vector);	
}

function sharpe_ratio(vector){
	
	return (vector_mean(vector) - 0.25) /vector_stdev(vector);	// Based on 3 month    // US Treasury Bonds Rates 3 Month
              //"https://query1.finance.yahoo.com/v8/finance/chart/%5EIRX";
}

function vector_norm_stdev(vector){
	
	return vector_mean(vector) - (1.654 * vector_stdev(vector));	
}

function covariance(vector1, vector2){
	return jStat.covariance(vector1 , vector2);
}


function correlation(vector1, vector2){

	return jStat.corrcoeff(vector1 , vector2);
}
function drift(vector){

	return vector_mean(vector) - vector_stdev(vector) / 2
}

function monte_carlo(price, drift , std){

	// MonteCarlo = Price * Exp(Drift + Std * Application.WorksheetFunction.NormInv(Rnd(), 0, 1))
	
	return price * Math.exp(drift +  std * jStat.normal.inv( Math.random(), 0, std_dev ))
}

// Handle Dates and Date Range

function is_min_date(input_date1, input_date2){
	
	return input_date1 <= input_date2 ? true : false
	
}

function is_max_date(input_date1, input_date2){

	return input_date1 >= input_date2 ? true : false

}

function max_price_in_date_range(arr , input_date){
	
	var not_found = false;
	
	//check if overlapping range	
	if ( Date.parse(arr[0].Date) > input_date ) {
		console.log("could not find min date range " + arr[0].Date + " > " + input_date );	
		return not_found			
	} 
	
	for (var i = arr.length-1; i >= 0 ; i-- ){

			if (is_min_date(Date.parse(arr[i].Date), input_date)){
				console.log("found: " +  arr[i].Adj_Close + " " +  arr[i].Date + " " + arr[i].Symbol  );
				return arr[i].Adj_Close;
				break;
			}				
		}
		
	console.log("could not find date in range")	;
	return not_found
}

function min_price_in_date_range(arr , input_date){
	
	var not_found = false;

	//check if overlapping range
	if ( Date.parse(arr[arr.length-1].Date) < input_date ){
		
		console.log("could not find  max date range " + arr[arr.length-1].Date + " < " + input_date )	;
		return not_found	
		
	} 
	
	for (var i = 0; i <= arr.length-1 ; i++ ){
			
			if (is_max_date(Date.parse(arr[i].Date), input_date)){
				console.log("found: " +  arr[i].Adj_Close + " " +  arr[i].Date + " " + arr[i].Symbol  );
				return arr[i].Adj_Close;
				break;
			}
					
		}
	console.log("could not find date in range")	;
	return not_found
}

// create string date segment array 
function create_date_range_arr(date1, date2){
	
	var temp_date1 = new moment(date1);
	var temp_date2 = new moment(date2);
	var date_arr = [];
	
	
	do
	{
			date_arr.push(moment(temp_date1).add(1,'months').format("YYYY-MM-DD"));
			temp_date1 = moment(temp_date1).add(1,'months');
	} 
	while(moment(temp_date1).add(1,'months') < temp_date2);
	
	
	date_arr.push(temp_date2.format("YYYY-MM-DD"));
	return date_arr
}

// create subset array extracted from the history quote
function create_ticker_arr_from_history( arr, ticker){
	
	var ticker_arr = [];
	
	for (i = 0 ; i < arr.length ; i++){
		if (arr[i].Symbol === ticker){
			ticker_arr.push(arr[i])
		}			
	}
	
	return ticker_arr
}


// Create Matrix array of  Tickers X Month 
// for this I'll will create 3 seperate arrays : tickers , Monhts and Growth

// 1. Ticker Array
function create_ticker_list_arr( arr ){
	
	var ticker_list = [arr[0].Symbol] || [];
	//var ticker = arr[0].Symbol || "";
	
	if (ticker_list.length){	
		for (i = 1 ; i < arr.length  ; i++){
			if (arr[i].Symbol !== arr[i-1].Symbol){
				ticker_list.push(arr[i].Symbol)
			}			
		}
	}
	else{
		alert("create_ticker_list_arr - no input array found")
		//Handle proper error 
	}	
	return ticker_list
}

// 2. array of month indicators
function create_month_arr( dateStart, dateEnd ){
	
		var timeValues = [];

		while (dateEnd >= dateStart) {
		   timeValues.push(dateStart.format('YYYY-MM'));
		   dateStart.add(1,'month');
		}
		return timeValues;
}

// 3. Create 1D array of growth
function create_1d_array_of_growth(){
	var i, j;
	var is_min_date_range, is_max_date_range;

	// check if date of ticker price corresponded to the date range
	is_min_date_range = dates(new Date(ticker_months_arr[0])).lastDayOfMonth;
	is_max_date_range = dates(new Date(ticker_months_arr[ticker_months_arr.length - 1])).firstDayOfMonth;
	alert("Min Date "+ is_min_date_range + " Max Date Range: " + is_max_date_range);
	
		// for(i = 0; i < ticker_months_arr.length; i++){

		// }
}



// Date object 
function dates(input_date){
	var dateObj = {
		now 				: new Date(),
		firstDayOfMonth 	: new Date(input_date.getFullYear(), input_date.getMonth(), 1),
		lastDayOfMonth		: new Date(input_date.getFullYear(), input_date.getMonth() + 1, 0),
		firstDayNextMonth	: new Date(input_date.getFullYear(), input_date.getMonth() + 1, 1),
		lastDayNextMonth	: new Date(input_date.getFullYear(), input_date.getMonth() + 2, 0),
		firstDayOfYear	 	: new Date(input_date.getFullYear(), 0, 1),
		lastDayOfYear		: new Date(input_date.getFullYear() + 1 , 0 , 0),
		firstDayNextYear	: new Date(input_date.getFullYear() + 1, 0 , 1),
		lastDayNextYear		: new Date(input_date.getFullYear() + 2, 0 , 0),
		dayOfDate			: input_date.getUTCDate(),
		monthOfDate			: input_date.getUTCMonth(),
		yearOfDate			: input_date.getUTCFullYear()
		
	}
	
	return dateObj
}


//rounding numbers
function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function monthDiff(d1, d2) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth() + 1;
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

function diff_months(dt2, dt1)   
 {  
  
  var diff =(dt2.getTime() - dt1.getTime()) / 1000;  
   diff /= (60 * 60 * 24 * 7 * 4);  
  return diff <= 0 ? 0 : round_to(diff,2)
    
 }  
 
 function round_to(num, dec){
	 return Math.round(num * Math.pow(10,dec)) / Math.pow(10,dec)
 }
 
 function calc_return(){
	 Math.pow(optim_obj._target_return + 1, diff_months(end,begin)) - 1
 }

  function generate_uniqe_numbers(limit)
  {
        var //limit = 10,
            amount = 3,
            lower_bound = 1,
            upper_bound = suggest_ticker.length - 1;
            unique_random_numbers = [];

        if (amount > limit) limit = amount; //Infinite loop if you want more unique
                                            //Natural numbers than existemt in a
                                            // given range
        while (unique_random_numbers.length < limit) {
            var random_number = Math.round(Math.random()*(upper_bound - lower_bound) + lower_bound);
            if (unique_random_numbers.indexOf(random_number) == -1) {
                // Yay! new random number
                unique_random_numbers.push( random_number );
            }
        }
        return unique_random_numbers;
  }
  
 //Check that portfolio contains stable data before submit to stats 
 function validate_portfolio(){
	 
		var num_of_returns = max_size_of_range_growth_arr();
		var remove_tickers = [];

		for(  i = portfolio._count_tickers - 1; i >=0 ; i--){
		//remove tickers with length less then max length reading
			if(portfolio.info[i].range_growth_arr.length < num_of_returns){ 
				alert("Ticker: " + portfolio._ticker_list[i] + 
						" found : " + portfolio.info[i].range_growth_arr.length + 
						" less than: " + num_of_returns + 
						" reading. Ticker will be removed from portfolio.");
				remove_tickers.push(portfolio._ticker_list[i]);
				continue 
			}else 
                            {   
                                date_range_arr = [];
                                date_range_arr = portfolio.info[i].range_data.map(function(el){return el[0]});
                                portfolio._date_ragne_arr = date_range_arr;
                                
                            }		
		//remove tickers where one of the elements is undefine	
			var undefine_element = portfolio.info[i].range_growth_arr.map(function(el){return isNaN(el)}).indexOf(true);
			
			if(undefine_element > -1){
				alert("Ticker: " + portfolio._ticker_list[i] + " element #[" + undefine_element + "] is undefined. Ticker will be removed from portfolio.");
				remove_tickers.push(portfolio._ticker_list[i]);
				continue 				
			}

		} //end for
		
		if(remove_tickers.length > 0){
	//	dialog("No Data Found","Could not get data for symbols: " + remove_tickers.join(" , ") + "\nSymbol/s will be removed from portfolio", BootstrapDialog.TYPE_DANGER); 
		remove_ticker_from_portfolio2(remove_tickers);
		}

 }
 

 function build_portfolio(weight_option){
	try{
			two_dim_arr = initialize_two_dim_array(portfolio._count_tickers,portfolio.info[0].range_growth_arr.length)
			create_growth_combine_arr();
			portfolio._returns = two_dim_arr;
			// create correlation array
			two_dim_arr = initialize_two_dim_array(portfolio._count_tickers,portfolio._count_tickers);
			create_correlation_arr();
			portfolio._correlation = two_dim_arr;
			// create covariance array
			two_dim_arr = initialize_two_dim_array(portfolio._count_tickers,portfolio._count_tickers);
			create_covariance_arr();
			portfolio._covariance = two_dim_arr;
			portfolio._mean_arr = portfolio_mean_arr();
			portfolio._stdev_arr = portfolio_stdev_arr();
			
			//calculate portfolio mean and std based on option
			if(weight_option === 0){ // equal weight for each stock
				portfolio._weight_option = "equal"
				portfolio._wgt_arr = math.divide(math.ones(portfolio._count_tickers),portfolio._count_tickers);

			}else if(optim_obj) // if portfolio was optimized
                        {
				portfolio._weight_option = "optimized"
				portfolio._wgt_arr = math.matrix(optim_obj._weight);				
			}else{
                            alert("can't build portfoio - something is wrong.");
                            return;
                        }
			
			if (portfolio._mean_arr.length === portfolio._wgt_arr._data.length ){ //size of latest portfolio <> size of history matrix
				//calculate porfolio average return
				portfolio._mean = portfolio_mean(portfolio._mean_arr , portfolio._wgt_arr._data);
				//calculate portfolio standard deviation
				portfolio._std_dev = portfolio_stdev(portfolio._covariance._data , portfolio._wgt_arr._data);
				portfolio._s_Ratio = (portfolio._mean - 0.001) / portfolio._std_dev;
			}
			else {
					alert ("Can't optimize portfolio - not the same size of portfolio");
                                        return;
			}
	}
	catch(e){
				console.log("error in build_portfolio");
				$("#buildPortfolio").addClass("btn btn-danger"); 
				$("#buildPortfolio").text("No Portfolio");
				$("#buildPortfolio").attr("disabled","disabled");
				dialog('Error', e + "\n\nCan't build portfolio at this stage" ,BootstrapDialog.TYPE_DANGER);
	}
			
 }
 
 //this function build a portfolio based on the input from original one
 function benchmark_portfolio(){
     			console.log("Creating benchmark portfolio")
			portfolio_history = portfolio; // save portfolio to history and initialize new object			
			portfolio = {};
			json_quotes = [];
			portfolio._count_tickers = portfolio_history._count_tickers;
			portfolio._ticker_list = portfolio_history._ticker_list;
 
			// update date range
			//begin = moment(portfolio_history._to_date).add(1,'days')._d;
			//end   = moment()._d;			
			//portfolio._from_date 	= begin.format('isoDate');
			//portfolio._to_date		= end.format('isoDate');
		
			get_quotes(portfolio._ticker_list);
			portfolio._ticker_list = portfolio.info.map(function(el){return el.Symbol}) ; 
			portfolio._count_tickers = portfolio._ticker_list.length;	
			
			weight_option = 1;   
			growth_readings = max_size_of_range_growth_arr();
			validate_portfolio();
			
			if (portfolio._count_tickers > 2) {build_portfolio(weight_option)}
			else { alert("can't build portfolio with less than 3 items")};
 }
 
 
 function max_size_of_range_growth_arr(){
	 
	 return math.max(portfolio.info.map(function(el){return el.range_growth_arr.length}))
	 
 }
 
  function max_size_of_price_arr(){
	 
	 return math.max(portfolio.info.map(function(el){return el.daily_prices.length}));
	 
 };
 
 function index_of(ticker){
	 
	 return portfolio._ticker_list.indexOf(ticker) 
 }
 
 function remove_ticker_from_portfolio(ticker){
	 
	// var remove_index = index_of(ticker);
	 var remove_index = portfolio._ticker_list.reverse().indexOf(ticker);
	 
	// if(index_of(ticker) !== -1){
	if(remove_index	 !== -1){		 
			portfolio._ticker_list.splice(remove_index,1);
			portfolio._count_tickers = portfolio._ticker_list.length;
			portfolio._ticker_list.reverse();
						
	 }else{
		 return ticker
	 };
 };
 
  function remove_ticker_from_portfolio2(ticker_arr){
 
			portfolio._ticker_list = $(portfolio._ticker_list).not(ticker_arr);
			portfolio._count_tickers = portfolio._ticker_list.length;

// 19-Dec-17 : fix bug remove ticker from portoflio.info
/*			
			// remove tickers from portfolio.info
			var arrX = get_table_column(tb1,1);
			var arrY = ticker_arr;
			var arrIdxs = []; // holds index of removed tickers in portfolio.info
			
			// Create index array of removed tickers
			$.each(arrY, function(idx, column){arrIdxs.push(arrX.indexOf(column))});
			arrIdxs.sort();
			
			// remove tickers from portfolio.info
			   for (var i = arrIdxs.length -1; i >= 0; i--)
					portfolio.info.splice(arrIdxs[i],1);
*/
// end 19-Dec
 };

 function monte_carlo_simulation(price, drift, std){
    var temp_price, max_monte, min_monte, diff_days;

    temp_price  = price;
    max_monte   = price;
    min_monte   = price;

    for(var i = 0 ; i < monte_carlo_sim ; i++){

        temp_price = monte_carlo(temp_price, drift, std) ;
        if(temp_price > max_monte){max_monte = temp_price};
        if(temp_price < min_monte){min_monte = temp_price};

    }
    monte_carlo_obj.min = min_monte;
    monte_carlo_obj.max = max_monte;
    return monte_carlo_obj;

 };
 


// Build 2dim array from current quotes objecs
// rows - symbols
// cols - symbol + indicators to analyse
function create_indicators_array(){

var count_tickers       = portfolio._count_tickers; //  number of tickers
var count_indicators    = indicator_arr.length; // number of columns
var output_arr          = [];
var current_indicator ; 

    //initialize 2dim array
    output_arr = initialize_two_dim_array(count_tickers , count_indicators + 1);
    for(var row = 0  ; row < count_tickers ; row++ ){
            for (var column = 0; column < count_indicators ; column++){
					output_arr._data[row][0] = portfolio.info[row].Symbol;
                    //debugger;
                    current_indicator 				= indicator_arr[column]; 
                    output_arr._data[row][column + 1] 	= read_property_value(portfolio.info[row].current_quote, decode(current_indicator), row)||
                                                    read_property_value(portfolio.info[row],decode(current_indicator) ,row) ||
                                                    //read_property_value(portfolio.info[row].monte_carlo ,decode(current_indicator), row)||
                                                    // check if there is a method define in symbol object:
                                                    read_property_value(indicators,current_indicator, row)|| // define as a method in symbols
                                                  "NA";
            };
    };
    return output_arr;
};

 
 // return value of a property in an object
 function read_property_value(obj, prop, row) {
        if((obj[prop])){
        return parse_indicator(prop,obj[prop], row);
        }
         return 0;

}

// decode indicator function
function decode(prop){
    var asset_symbol = prop; 
   //$.each( symbols, function( key, value ) {
	 $.each( indicators, function( key, value ) {  
					if(value==	prop){asset_symbol=key};
					});	
    return asset_symbol;
};

// Utility function to convert indicators values
function parse_indicator(indicator, value, row){

    switch(indicator){
        case "MarketCapitalization":
            if (value.search("B") > -1 ){return value.substring(0, value.search("B"))*1000;};
            if (value.search("M") > -1 ){return value.substring(0, value.search("M")) * 1 ;};
            if (indicator.search("NA") > -1 ){return 0;};
            break;
        case "LastTradePriceOnly":
        case "ChangeinPercent":
        case "Change":
        case "FiftydayMovingAverage":
        case "PercentChangeFromYearLow" :
        case "Last_Change":
            return ps(value) ;
            break;
        // handle symbols methods
        case "Currency":
            return value.toUpperCase();
            break;
        case "Holdings":
            return n(symbols["Holdings"](row));
        case "Start_Date":
            return symbols["Start_Date"](row);
            break;
        case "Start_Price":
            return n(symbols["Start_Price"](row));
        break;//TODO: change hard coded element to value
        case "Start_Settlement":
            return n(symbols["Start_Settlement"](row));
            break;
        case "Total":
            return n(symbols["Total"](row));
            break;
        case "Change_Since_Inception":
            return n(symbols["Change_Since_Inception"](row));
            break;
        case "Total_Base_Currency":
            return n(symbols["Total_Base_Currency"](row));
            break;
        case "Pctg_Portfolio":
            return n(symbols["Pctg_Portfolio"]); 
        break;// will be handle in getRate function  
        // handle portfolio stats
        case "_count_tickers":
        case "_from_date":
        case "_to_date":
        case "_weight_option":
            return value;
        case "_mean":   
        case "_std_dev":
		case "growth_mean":
		case "growth_std":
        case "t_tatio":		
            return ps(value); 
            break;
		case "s_ratio":
		case "prices_mean":
             return n(value);
        default:
            return value ; // return the original value
    }

}

function sort_portfolio_indicator_by(idx){ // TODO: CHANGe TO A GLOBAL FUNCTION

        return  portfolio_indicator._data.sort(function(a,b){return a[idx] - b[idx];}).reverse();
};

////create ticker array from top current qoutes portfolio // TODO: I don't see this function called
//function get_top_symbols(count, indicator) {
//    var idx = indicator_arr.indexOf(indicator);
//    ticker_arr = [];
//    ticker_arr =    sort_portfolio_indicator_by(idx).map(function(el){return el[0]}).slice(0,count) ;
//    return ticker_arr;
//};

// Create Sharpe_Ratio array - will be used for back dated simulation
function create_sharpe_ratio_array(){
    
   s_r_arr = initialize_two_dim_array(portfolio.info.length , 3);// ticker, s_r) 
    for(var row = 0  ; row < portfolio.info.length ; row++ ){
            s_r_arr._data[row][0] = portfolio.info[row].Symbol;
            s_r_arr._data[row][1] = portfolio.info[row].s_ratio;
            s_r_arr._data[row][2] = portfolio.info[row].t_ratio;
        };
   //sort per s_ratio
   s_r_arr._data = s_r_arr._data.sort(function(a,b){return a[1] - b[1];}).reverse();
};



//get exchange rate for portfolio
//function exchange_rate_obj(){
//    
//    var currency_arr = [];
//    var pair_arr = []
//    
//    currency_arr = $.unique(portfolio.portfolio_data.map(function(el){return el[7]}));
//    for (i = 0 ; i < currency_arr.length ; i++){
//        pair_arr.push(currency_arr[i] + base_currency);
//    }
//   //getRate(pair_arr);
//	// replacing getRate with new ajax:
//	ajax_current_quotes5(pair_arr,"rates");
//}
//
// validate current quote object does not contain garbage
function validate_current_quotes_obj(res){
    
    var valid_quote_arr = [];
    //var res =  [];
    
    // if only one ticker returned, then push result object to res
//    if (current_quotes_obj.query.count = 1){res.push(current_quotes_obj.query.results.quote);}
//    else {res = current_quotes_obj.query.results.quote;};
    
    var y = res.map(function(el){return el.Name}); // holds name of symbols
    $.each(y,function(idx,el){if(el != null){
            valid_quote_arr.push(current_quotes_obj.query.results.quote[idx]);          
        }});
    
        current_quotes_obj.query.results.quote = valid_quote_arr;
        current_quotes_obj.query.count = valid_quote_arr.length;
}

//////         Add HTML elements ////////////////////
//function div_stats(){    
//        var val = "";
//        var stats = [ "_count_tickers", "_from_date", "_to_date", "_mean", "_std_dev", "_s_Ratio", "_weight_option" ];
//        var list = document.createElement("ul");
//        $("ul").attr({
//                        id : "stats",
//                        "style" : "list-style-type:none"
//                    });
//        $.each(stats,function(idx,el){
//          val = symbols[el] + read_property_value(portfolio, el, 0);
//          $("#stats").append('<li>' + val + '</li>');
//        });
//        
//        $("body").append(list); // TODO: Wrap in a div. 
//}

/// find closest date
function find_closest_date_unix(element) {
	//	if( element[0] >=  moment(settled_date).valueOf()) // TODO: check if element 0 is a moment object. if not wrap element with moment().valueof()
	if( moment.unix(element[0]).valueOf() >=  moment(settled_date).valueOf() ) 
	{return element}
//example of call+answer:
	//chart_arr._data.find(find_closest_date)
	//[1490824800000, 167.5]
}

/// find closest date
function find_closest_date(element) {

	//	if( element[0] >=  moment(settled_date).valueOf()) // TODO: check if element 0 is a moment object. if not wrap element with moment().valueof()
	if( moment(element[0]).valueOf() >=  moment(settled_date).valueOf() ) 
	{return element}
//example of call+answer:
	//chart_arr._data.find(find_closest_date)
	//[1490824800000, 167.5]
}

/// find closest month
function find_closest_month(element) {

	if( moment(element[0]).valueOf() >=  moment(search_month).valueOf())
	{return element}

}

function find_closest_rate(element) {

	if( element >=  settled_date)
	{return element}

}

function rateExchange(element) {

	if( element[0] >=  settled_date)
	{return element}

}

//validate input before add to portfolio
function validate_add2portfolio(){
	var valid = false;
	
	if (!settled_date)
	{
		$(".validate").text("Please enter start date:");
		return valid;
	}
 	if ( moment(settled_date).valueOf() < moment.unix(tickers_history_quotes[selected_symbol][0][0]).valueOf() || moment(settled_date).valueOf() > moment.unix(tickers_history_quotes[selected_symbol][tickers_history_quotes[selected_symbol].length-1][0]).valueOf())
	{
		$(".validate").text("Date: " + settled_date + " out of range :" + moment.unix(tickers_history_quotes[selected_symbol][0][0]).format('YYYY-MM-DD') + " and " + moment.unix(tickers_history_quotes[selected_symbol][tickers_history_quotes[selected_symbol].length-1][0]).format('YYYY-MM-DD'));
		return valid;		
	} 

	if (!settled_amt && !settled_holding){
		$(".validate").text("Enter Either/Or Amount/Holdings:");
		return valid;
	}	
 	if ( numeral(settled_amt)._value ===  0 )  {
		$(".validate").text("Please enter settled amount grater than zero");
		return valid;
	}
 	if ( numeral(settled_amt)._value < 0 )  {
		$(".validate").text("Please enter settled amount grater than zero");
		return valid;
	}	
 	if ( numeral(settled_holding)._value ===  0 )  {
		$(".validate").text("Please enter number of holdings grater than zero");
		return valid;
	}
 	if ( numeral(settled_holding)._value < 0 )  {
		$(".validate").text("Please enter number of holdings grater than zero");
		return valid;
	}		
 
    valid = true;
	return valid;
}

//validate before purchase
function validate_before_purchase(obj){

	var valid = false;
	
	// no need for portfolio
	if(obj.find('.noPortfolio').length > 0){
		valid = true;
		return valid
	}
	
	//portfolio readyState
	if(!portfolio_ready){
		message_h = "Portfolio not ready"
		message_b = "Portfolio is not ready. \n\nPlease click on Analyse Portfolio or try again later."
		return valid;
	}	
	//daily tracking size
	if(!daily_track._data || daily_track._data.length < 200 ){
		message_h = "No portfolio data"
		message_b = "Could not generate consolidated porttfolio (daily tracking). \n\nPlease try again later or report error to admin."
		return valid;
	}		
	
	//number of stocks
	if(tbRows < 3 ){
		message_h = "Not enough stocks"
		message_b = "You need at least 3 stocks to build a portfolio. \n\nPlease try again later or report error to admin."
		return valid;
	}

	// portfolio.info
	if(portfolio.info.length < 3 ){
		message_h = "Not enough stocks"
		message_b = "System could not generate portfolio.  \n\nPlease try again later or report error to admin."
		return valid;
	}

	// portfolio.info
	if(combine_price._data.length < (tbRows - 3) ){
		message_h = "Not enough stocks"
		message_b = "Not enough stocks to generate stable portfolio. \n\nPlease try again later or report error to admin."
		return valid;
	}		
 
    valid = true;
	return valid;
}

//validate before purchase
function validate_license(obj){
	var valid = false;
	
	if(obj.find('.glyphicon-shopping-cart').length > 0){
		return valid;
	}
	
	if(!portfolio_ready){
			dialog('Portfolio Not Ready', "Please click on Analyse Portfolio." ,BootstrapDialog.TYPE_INFO);
			return valid;
	}	
	
//	if( (obj.children().attr("data-max_tickers") < tbRows) && (!$( "#RadioSample" ).prop( "checked" )) && (purchase.indexOf("ALL") == -1) ){
//
//		dialog("License Exceed", "License for feature: " + obj.children().data().name + " is limited to :" + obj.children().data().max_tickers +".\n\n Number of current portfolio symbols: " + tbRows +".\n\n Please reduce number of symbols.")
//
//		return valid;
//	}
 
    valid = true;
	return valid;
}
 
// handle database
function update_db_portfolio(tb_content, operation, portfolio_type){
	
	sql_operation = operation;
	
		$.ajax({
				  method: "GET",
				  url: "http://127.0.0.1:5000/update_user_portfolio",
				  data: { 	portfolioM			: tb_content ,
							count_rows			: tbRows,
							action				: operation,
							portfolio_type		: portfolio_type
						 }
				})
				  .done(function(data) {					  
						 tb = data;
						// console.log(tb);
						 if(sql_operation === "select"){
								 tb1.destroy();
								 $("#tblPortfolioM tbody").empty();
								 $("#tblPortfolioM tbody").html(tb);
								 //rebuild tb1							
									tb1 = $('#tblPortfolioM').DataTable({
												"paging":   false,
												"info":     false,
												"searching": false,
												"responsive": true,
												"scrollX": true,
												"scrollY":        "600px",
												"scrollCollapse": true
									 })
								//	 $("#combobox").val(get_table_column(tb1,7)[0]).change();
								tbRows = tb1.rows().data().length;
						 }
						refresh_table_data();
						handle_footer();
						
				  });


// load portfolio...				  
}

function get_purchase_feature(tb_content, operation, portfolio_type){

		$.ajax({
				  method: "POST",
				  url: "save_portfolio2DB.php",
				  data: { 	portfolioM			: tb_content ,
							count_rows			: tbRows,
							action				: operation,
							portfolio_type		: portfolio_type
						 }
				})
				  .done(function(data) {					  
						 console.log("purchased features: " + data);
						 purchase = JSON.parse(data);
						 
						 // mark purchasable item with v icon
						if(purchase.length > 0){
							// if "ALL" selected mark all commercial
							if(purchase.indexOf("ALL") > -1){
								$(".glyphicon-shopping-cart ").each(function(){
															$(this).removeClass('glyphicon-shopping-cart')
																	.addClass('glyphicon-ok')
																	.attr('data-max_tickers',purchase[purchase.length - 1])
																	.parents('.base-currency').find('.selectpicker').removeAttr('disabled');
															$('.selectpicker').selectpicker('refresh');
													})	
							}
							else{ // only some purchase
							$.each(purchase,function(idx,el){
								$(".glyphicon-shopping-cart ").each(function(){
								if($(this).data().name == el)$(this).removeClass('glyphicon-shopping-cart')
																	.addClass('glyphicon-ok')
																	.attr('data-max_tickers',purchase[purchase.length - 1])
																	.parents('.base-currency').find('.selectpicker').removeAttr('disabled');
															$('.selectpicker').selectpicker('refresh');																
									})
								})
							} // end else
						}// end if purchase > 0
				  }); // end .done
}

function get_purchase_market(tb_content, operation, portfolio_type){

		$.ajax({
				  method: "POST",
				  url: "save_portfolio2DB.php",
				  data: { 	portfolioM			: tb_content ,
							count_rows			: tbRows,
							action				: operation,
							portfolio_type		: portfolio_type
						 }
				})
				  .done(function(data) {					  
						 console.log("purchased suggest market portfolio: " + data);
						 var t_purchase_market = JSON.parse(data);
						 
						 // populate array of purchased market
						if(t_purchase_market.length > 0){
							 $.each(t_purchase_market,function(idx,el){purchase_market.push(el.substring(7))});
						}// end if purchase > 0
				  }); // end .done
}

function get_historic_purchase(tb_content, operation, portfolio_type){

		$.ajax({
				  method: "POST",
				  url: "save_portfolio2DB.php",
				  data: { 	portfolioM			: tb_content ,
							count_rows			: tbRows,
							action				: operation,
							portfolio_type		: portfolio_type
						 }
				})
				  .done(function(data) {					  
						 
				   var purchase_history = JSON.parse(data);
				   
				       $('#purchase_historyTb').DataTable( {
							"responsive": true,
							"scrollX": true,
							"scrollY":        "600px",
							"scrollCollapse": true,
							data: purchase_history,
							columns: [
								{ title: "User" },
								{ title: "Purchase Date" },
								{ title: "Portfolio" },
								{ title: "Feature Purchased" },
								{ title: "Purchase Amount" },
								{ title: "Payment ID" },
								{ title: "Payment Type" },
								{ title: "Payment Status" },
								{ title: "Card Type" },
								{ title: "Count Tickers" },
								{ title: "Portfolio Tickers" }
							]
						} );

				  }); // end .done
}



//Get column data
function get_table_column(table,column){
	
	return $(table.column(column).data()).splice(0,table.column(column).data().length)
}

//get latest price and update table
function refresh_table_data(){

	ticker_list_arr = get_table_column(tb1,1);
		
	if (ticker_list_arr.length > 0){
		get_history2();
	}
}

// build combine prices and combine return arrays

function combine_prices(){
	
	var res = [];	
	var idx ; 
	var closest_price;
	

	
	//res holds the combined dates
	for (x=0; x < portfolio._count_tickers; x++){
		for (j=0;  j < portfolio.info[x].daily_prices.length; j++){
				res.push(portfolio.info[x].daily_prices[j][0])}}
		
	$.unique(res).sort();
	
	combine_price = initialize_two_dim_array(portfolio._count_tickers + 1, res.length);	
	combine_return = initialize_two_dim_array(portfolio._count_tickers + 1, res.length);
		
	// insert first column date.
	for (i = 0 ; i < res.length; i++){
		combine_price._data[0][i] = res[i];
		combine_return._data[0][i] = res[i]
	};
	
	// go over all ticker daily prices and insert into array
	for (var x=0; x < portfolio._count_tickers; x++){

		for (var j=0;  j < portfolio.info[x].daily_prices.length; j++){
			idx = res.indexOf(portfolio.info[x].daily_prices[j][0]);  // if it can't find a date match, means the res.unique.sort is wrong!
			// Ensure first combine date/price <> 0;
			if ( j==0 && idx > 0 ){
				//populate price with the closest price
				settled_date = portfolio.info[x].daily_prices[j][0];  // search criteria settled_date
				
				var price_element = portfolio.info[x].daily_prices.find(find_closest_date); // TODO: make sure we have a valid price
				
				combine_price._data[x+1][0] = price_element[1]; 
				continue;
			}
			if (idx > -1){ // found matching date
				combine_price._data[x+1][idx] = portfolio.info[x].daily_prices[j][1]

			}

		}
			// go over the combined prices and populate "zero" (initizlize) prices with the previous day price (to avoid division by zero for growth)
		for (  var z=0;  z < res.length; z++){	
			if (combine_price._data[x+1][z] == 0){
				combine_price._data[x+1][z] = combine_price._data[x+1][z - 1];
			}
		}
	}
		
	// calculate daily return 
	for (var x=0; x < portfolio._count_tickers; x++){
		for (var z = 1; z < res.length ; z++){
			combine_return._data[x+1][z] =  numeral(Math.log(combine_price._data[x+1][z]/combine_price._data[x+1][z - 1])).format('0.0000%');
		}	
	}
	
	portfolio._daily_prices = combine_price._data;
	portfolio._daily_returns = combine_return._data;

}




// build  weights array 
function create_weight_array(){

	var cur_wgt_arr = [];
	var bal_wgt_arr = [];
	var opt_wgt_arr	= [];
	var output_arr = [];
	
	cur_wgt_arr = get_table_column(tb1,15);
	bal_wgt_arr = math.multiply(math.ones(portfolio._count_tickers)._data,1/portfolio._count_tickers);
	output_arr  = initialize_two_dim_array(portfolio._count_tickers, 5);

    for(var row = 0  ; row < portfolio._count_tickers ; row++ ){
            for (var column = 0; column < 5 ; column++){
					output_arr._data[row][0] = portfolio.info[row].Symbol;
					output_arr._data[row][1] = p(cur_wgt_arr[row]);
					output_arr._data[row][2] = p(bal_wgt_arr[row]);
                    output_arr._data[row][3] = 0;
					output_arr._data[row][4] = 0;
            }
    }
    return output_arr;
};




function create_monte_carlo_array(price_arr){

	var output_arr = [];
	var monte_carlo = {};
	var temp_growth_arr = [];
	var temp_daily_growth_mean, temp_daily_growth_std, temp_daily_growth_drift ;
	
	output_arr  = initialize_two_dim_array(portfolio._count_tickers, 10); //"Symbol","Days Back","fluctuation","Strike Price", "Strike Date" "Max Predicted Price","Min Predicted Price", "Recent Price", "Recent Price Date" "Sell?"

    for(var row = 0  ; row < portfolio._count_tickers ; row++ ){
		
			//recalculate mean, std and drift 
			temp_growth_arr = portfolio.info[row].growth_arr.slice(0,portfolio.info[row].daily_growth_count - slider_d.getValue());
			temp_daily_growth_mean        = vector_mean(temp_growth_arr);
			temp_daily_growth_std         = vector_stdev(temp_growth_arr);
			temp_daily_growth_drift       = temp_daily_growth_mean - (Math.pow(temp_daily_growth_std,2)/2);
			
			monte_carlo_sim 	= slider_d.getValue(); // how many steps to calculate monte
			monte_carlo       	=  monte_carlo_simulation(price_arr[row][1] , //ticker_quote.monte_strike_price,
												temp_daily_growth_drift, //ticker_quote.daily_growth_drift,
												temp_daily_growth_std // ticker_quote.daily_growth_std);	
												);
												
            for (var column = 0; column < 10 ; column++){
				
				
					output_arr._data[row][0] = portfolio.info[row].Symbol;
					output_arr._data[row][1] = slider_d.getValue();
					output_arr._data[row][2] = slider_s.getValue();
                    output_arr._data[row][3] = n(price_arr[row][1]); // Strike Price
					output_arr._data[row][4] = moment(price_arr[row][0]).format("YYYY-MM-DD"); // Strike date
					
					output_arr._data[row][5] = n(monte_carlo.max);
					output_arr._data[row][6] = n(monte_carlo.min);
					
					output_arr._data[row][7] =  n(portfolio.info[row].daily_prices[portfolio.info[row].daily_prices.length - 1][1]); //recent price
					output_arr._data[row][8] =  moment(portfolio.info[row].daily_prices[portfolio.info[row].daily_prices.length - 1][0]).format("YYYY-MM-DD"); // recent date
					
					// Sell ?
					monte_carlo.min > portfolio.info[row].daily_prices[portfolio.info[row].daily_prices.length - 1][1]?
					output_arr._data[row][9] = "YES" :
					output_arr._data[row][9] = "NO"
            }
    }
    return output_arr;
};

function create_prediction_arr(symbol){

	var output_arr = [];
	var monte_carlo = {};
	var temp_growth_arr = [];
	var temp_daily_growth_mean, temp_daily_growth_std, temp_daily_growth_drift ;
	
	output_arr  = initialize_two_dim_array(portfolio._count_tickers, 10); //"Symbol","Days Back","fluctuation","Strike Price", "Strike Date" "Max Predicted Price","Min Predicted Price", "Recent Price", "Recent Price Date" "Sell?"

    for(var row = 0  ; row < portfolio._count_tickers ; row++ ){
		
			//recalculate mean, std and drift 
			temp_growth_arr = portfolio.info[row].growth_arr.slice(0,portfolio.info[row].daily_growth_count - slider_d.getValue());
			temp_daily_growth_mean        = vector_mean(temp_growth_arr);
			temp_daily_growth_std         = vector_stdev(temp_growth_arr);
			temp_daily_growth_drift       = temp_daily_growth_mean - (Math.pow(temp_daily_growth_std,2)/2);
			
			monte_carlo_sim 	= slider_d.getValue(); // how many steps to calculate monte
			monte_carlo       	=  monte_carlo_simulation(price_arr[row][1] , //ticker_quote.monte_strike_price,
												temp_daily_growth_drift, //ticker_quote.daily_growth_drift,
												temp_daily_growth_std // ticker_quote.daily_growth_std);	
												);
												
            for (var column = 0; column < 10 ; column++){
				
				
					output_arr._data[row][0] = portfolio.info[row].Symbol;
					output_arr._data[row][1] = slider_d.getValue();
					output_arr._data[row][2] = slider_s.getValue();
                    output_arr._data[row][3] = n(price_arr[row][1]); // Strike Price
					output_arr._data[row][4] = moment(price_arr[row][0]).format("YYYY-MM-DD"); // Strike date
					
					output_arr._data[row][5] = n(monte_carlo.max);
					output_arr._data[row][6] = n(monte_carlo.min);
					
					output_arr._data[row][7] =  n(portfolio.info[row].daily_prices[portfolio.info[row].daily_prices.length - 1][1]); //recent price
					output_arr._data[row][8] =  moment(portfolio.info[row].daily_prices[portfolio.info[row].daily_prices.length - 1][0]).format("YYYY-MM-DD"); // recent date
					
					// Sell ?
					monte_carlo.min > portfolio.info[row].daily_prices[portfolio.info[row].daily_prices.length - 1][1]?
					output_arr._data[row][9] = "YES" :
					output_arr._data[row][9] = "NO"
            }
    }
    return output_arr;
};

function resource_portfolio(ind){
	 p_semaphor = ind;
}

// Daily stats

function daily_stats(){
	try{
		
			var first_date;
			var price_date_range = [];
			var combine_price_range = []; // holds a combine price data for the selected date
			var first_date_idx;
			var combine_record = []; // holds one record from combine_price array
			var day_total;
			var weight_arr = portfolio._wgt_arr._data;
			var tickers_currency = [];
			var temp_price_rx = []; // holds the current price converted to the rate on the same day
			//var daily_rateEX = [];
			var weight   = [];
			var holdings 	= [];
			var price_factor = [];
			var rx_date = []; // holds an array of rate exchange
			
			

		//1. get first date
		//settled_date 		= currency_history_obj[Object.keys(currency_history_obj)[0]][0][0];
		settled_date 		= combine_price._data[0][0];
		price_date_range 	= combine_price._data[0];
		first_date 			= price_date_range.find(find_closest_rate); // find first date which I have a rate exchange data
		first_date_idx		=  price_date_range.indexOf(first_date);
		price_date_range	= price_date_range.slice(first_date_idx);
		holdings = get_table_column(tb1,3);
		price_factor = get_table_column(tb1,16);

		
		daily_track = initialize_two_dim_array(price_date_range.length, 4);
		//create price array of first date
		combine_price._data.map(function(el,idx){if (idx>0)combine_record.push(el[first_date_idx])});
		// create tickers currency_arr
		portfolio.info.map(function(el,idx){tickers_currency.push(el.current_quote["quoteSummary.result.0.price.currency"].toUpperCase())});
		// create array of current price converted to the rate exchange in the same day. (the most complicated function code in the project :-)
		combine_record.map(function(el,idx){						
					//remap ILA to ILS
					var currency = tickers_currency[idx] == "ILA" ? "ILS" : tickers_currency[idx];
					temp_price_rx.push(
										numeral(numeral(combine_record[idx])._value * numeral(holdings[idx])._value /currency_history_obj[currency].find(rateExchange)[1] / currency_denominator(currency))._value
										)
						});
		// calculate weight for the day
		weight = math.divide(temp_price_rx,math.sum(temp_price_rx));
		
				daily_track._data[0][0] = price_date_range[0];
				daily_track._data[0][1] = '$'+n(math.sum(temp_price_rx)); 
				daily_track._data[0][2] = 0;
				daily_track._data[0][3] = 0;
		
		for (var x = 1; x < price_date_range.length; x++){
			
		//reset vars
				combine_record = [];
				//daily_rateEX=[];
				temp_price_rx = [];
				settled_date		= 	price_date_range[x];	

				combine_price._data.map(function(el,idx){if (idx>0)combine_record.push(el[x])});

		// create array of current price converted to the rate exchange in the same day. (the most complicated function code in the project :-)
				combine_record.map(function(el,idx){
									//remap ILA to ILS
					var currency = tickers_currency[idx] == "ILA" ? "ILS" : tickers_currency[idx];
					//daily_rateEX.push(currency_history_obj[currency].find(rateExchange)[1]);
					var currency_latest_date = currency_history_obj[currency][currency_history_obj[currency].length-1][0];
					var currency_date_price = currency_history_obj[currency][currency_history_obj[currency].length-1][1];
					if (settled_date < currency_latest_date){
						//console.log("if " + currency_history_obj[currency].find(rateExchange)[1]);
						temp_price_rx.push(
									numeral(numeral(combine_record[idx])._value * numeral(holdings[idx])._value /
													currency_history_obj[currency].find(rateExchange)[1]
									  / currency_denominator(currency))._value
									)
					}
					else{
						//console.log("else " + currency_date_price);
						temp_price_rx.push(
									numeral(numeral(combine_record[idx])._value * numeral(holdings[idx])._value /
													currency_date_price
									  / currency_denominator(currency))._value
									)
						
					}
				});
		// calculate weight for the day
		weight = math.divide(temp_price_rx,math.sum(temp_price_rx));		
			
				daily_track._data[x][0] = price_date_range[x];
				daily_track._data[x][1] = '$'+n(math.sum(temp_price_rx)); 
				daily_track._data[x][2] = n(numeral(daily_track._data[x][1])._value - numeral(daily_track._data[x-1][1])._value);
				daily_track._data[x][3] = p(numeral(daily_track._data[x][1])._value / numeral(daily_track._data[x-1][1])._value - 1);
		}
		
		portfolio.daily_tracking = daily_track._data; // add to portfolio
		// create chart
		var x = initialize_two_dim_array(daily_track._data.length,2);
		$.each(daily_track._data,function(idx,el){x._data[idx][0] = numeral(moment(el[0]).format("X"))._value; x._data[idx][1] = numeral(el[1])._value});
		tickers_history_quotes.portfolio = x._data;
	}
	catch(e){
				console.log("error in daily stats");
				dialog('Error', e + "\n\nCan't build portfolio at this stage" ,BootstrapDialog.TYPE_DANGER);
				$("#buildPortfolio").addClass("btn btn-danger"); 
				$("#buildPortfolio").text("No Portfolio");
				$("#buildPortfolio").attr("disabled","disabled");
	}
		
}

function generate_accumulated_growth_array(ticker_arr){

		var ret_arr = [];
		
		ret_arr = initialize_two_dim_array(ticker_arr.daily_prices.length, 2);
		
		//set first row
		ret_arr._data[0][0] =  ticker_arr.daily_prices[0][0];
		
		for (var x = 1 ; x < ret_arr._data.length; x++){
				ret_arr._data[x][0] = ticker_arr.daily_prices[x][0]; // set date
				ret_arr._data[x][1] = (1+ret_arr._data[x-1][1])*(1+ticker_arr.growth_arr[x-1]) -1; // set accumulated growth
		}
		
		return ret_arr;
	
}	

function stable_prices(price_array){
	
	var length = price_array.length;
	var first_price = price_array[0][1];

// check the first element is not null. If it is, void the whold list. 	
//	if(!first_price) return price_array; 
	
	for (var i=1; i < length; i++){
		// check for null
		var prev_price = price_array[i-1][1];
		var price_factor = factor10(price_array[i][1], prev_price);
		
		if(!prev_price) continue; 
		
		// Replace undefine with previous day price
		if(!price_array[i][1]){
			price_array[i][1] = prev_price;
		}	
		
		// Handle factor price
		if ((price_factor !== 1) && (price_factor !== 0) ){
			price_array[i][1]/=price_factor;
		}					

	}
	return price_array
}

// flatten object
function flattenObject(ob) {
	var toReturn = {};
	
	for (var i in ob) {
		if (!ob.hasOwnProperty(i)) continue;
		
		if ((typeof ob[i]) == 'object') {
			var flatObject = flattenObject(ob[i]);
			for (var x in flatObject) {
				if (!flatObject.hasOwnProperty(x)) continue;
				
				toReturn[i + '.' + x] = flatObject[x];
			}
		} else {
			toReturn[i] = ob[i];
		}
	}
	return toReturn;
};
	
function addNWdays(date , businessDays) {
	
  var counter = 0, tmp = new Date(date);
  while( businessDays>=0 ) {
    tmp.setTime( date.getTime() + counter * 86400000 );
    if(isBusinessDay (tmp)) {
      --businessDays;
    }
    ++counter;
  }
  return tmp;
}

function isBusinessDay (date) {
  var dayOfWeek = date.getDay();
  if(dayOfWeek === 0 || dayOfWeek === 6) {
    // Weekend
    return false;
  }
  
  holidays = [
    '12/31+5', // New Year's Day on a saturday celebrated on previous friday
    '1/1',     // New Year's Day
    '1/2+1',   // New Year's Day on a sunday celebrated on next monday
    '1-3/1',   // Birthday of Martin Luther King, third Monday in January
    '2-3/1',   // Washington's Birthday, third Monday in February
    '5~1/1',   // Memorial Day, last Monday in May
    '7/3+5',   // Independence Day
    '7/4',     // Independence Day
    '7/5+1',   // Independence Day
    '9-1/1',   // Labor Day, first Monday in September
    '10-2/1',  // Columbus Day, second Monday in October
    '11/10+5', // Veterans Day
    '11/11',   // Veterans Day
    '11/12+1', // Veterans Day
    '11-4/4',  // Thanksgiving Day, fourth Thursday in November
    '12/24+5', // Christmas Day
    '12/25',   // Christmas Day
    '12/26+1',  // Christmas Day
  ];
var dayOfMonth = date.getDate(),
  month = date.getMonth() + 1,
  monthDay = month + '/' + dayOfMonth;

  if(holidays.indexOf(monthDay)>-1){
    return false;
  }

  var monthDayDay = monthDay + '+' + dayOfWeek;
  if(holidays.indexOf(monthDayDay)>-1){
    return false;
  }

  var weekOfMonth = Math.floor((dayOfMonth - 1) / 7) + 1,
      monthWeekDay = month + '-' + weekOfMonth + '/' + dayOfWeek;
  if(holidays.indexOf(monthWeekDay)>-1){
    return false;
  }
 var lastDayOfMonth = new Date(date);
  lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
  lastDayOfMonth.setDate(0);
  var negWeekOfMonth = Math.floor((lastDayOfMonth.getDate() - dayOfMonth - 1) / 7) + 1,
      monthNegWeekDay = month + '~' + negWeekOfMonth + '/' + dayOfWeek;
  if(holidays.indexOf(monthNegWeekDay)>-1){
    return false;
  }

  return true;
}

function createNWdaysSeries(date,days){
		
		var d_arr = [];
		var tmp_date = new Date(date);
		
		//d_arr.push(tmp_date.getTime()/1000);
		
		for(var i=0; i<days; i++){
			tmp_date = addNWdays(tmp_date, 1);
			d_arr.push(tmp_date.getTime()/1000);
		}
	return d_arr;
}

function calculate_prediction(ticker){
				var symbol;

				var readings = slider_p1.getValue();
				var future_prices = []; //  holds random growth
				var temp_price;
				var temp_growth_arr = [];
				var date_arr = [];
				var temp_daily_growth_mean, temp_daily_growth_std, temp_daily_growth_drift ;
				var future_arr = initialize_two_dim_array(readings , 2);
				
				// set global std_dev value
				
				std_dev = slider_p2.getValue();
				
				// get verctor of returns
				
				if(ticker == "portfolio"){
				// get last price and date
						var last_date = daily_track._data[daily_track._data.length - 1][0];
						var last_price = daily_track._data[daily_track._data.length - 1][1];	
						
						$.each(daily_track._data, function(ix, el){temp_growth_arr.push(numeral(el[3])._value)});
						temp_daily_growth_mean        = vector_mean(temp_growth_arr);
						temp_daily_growth_std         = vector_stdev(temp_growth_arr);
						temp_daily_growth_drift       = temp_daily_growth_mean - (Math.pow(temp_daily_growth_std,2)/2)
				}
				else // 
				{
						
						var myobj = $.grep(portfolio.info,function(obj){return obj.Symbol == ticker})
						
						var last_date 	= myobj[0].daily_prices[myobj[0].daily_prices.length - 1][0];
						var last_price 	= myobj[0].daily_prices[myobj[0].daily_prices.length - 1][1];							
						
						temp_daily_growth_mean        = myobj[0].daily_growth_mean;
						temp_daily_growth_std         = myobj[0].daily_growth_std;
						temp_daily_growth_drift       = myobj[0].daily_growth_drift;			
					
				}
				
				// create business days range
				date_arr = createNWdaysSeries(last_date,readings);
				// create future_prices
				temp_price = numeral(last_price)._value;
				max_monte   = numeral(last_price)._value;
				min_monte   = numeral(last_price)._value;

				for(var x = 0 ; x < readings; x++){
					
					temp_price =  monte_carlo(temp_price, temp_daily_growth_drift , temp_daily_growth_std);
					future_prices.push(temp_price)
					//save min, max prices in the current simulation
					if(temp_price > max_monte){max_monte = temp_price};
					if(temp_price < min_monte){min_monte = temp_price};
					//combined array:
					future_arr._data[x][0] = date_arr[x];
					future_arr._data[x][1] = future_prices[x];
				}// end for
				

				// add to summary table
				sim_counter++;
				monte_prd_arr._data[sim_counter][0]	= sim_counter;
				monte_prd_arr._data[sim_counter][1]	= n(min_monte);
				monte_prd_arr._data[sim_counter][2]	= n(max_monte);
				monte_prd_arr._data[sim_counter][3]	= n(temp_price);
				monte_prd_arr._data[sim_counter][4]	= n(last_price);
				monte_prd_arr._data[sim_counter][5]	= ps(numeral(temp_price)._value / numeral(last_price)._value - 1);
				
				
				// create same date range for both array 
				var history_date_range = [];
				var full_date_range = [];
				
				tickers_history_quotes[ticker].map(function(el){history_date_range.push(el[0])});
				// add the future range
				full_date_range = history_date_range.concat(date_arr);
				
				// create two arrays to sent to charts
				
				var arr1 = initialize_two_dim_array(full_date_range.length, 2); // holds original quotes
				var arr2 = initialize_two_dim_array(full_date_range.length, 2); // holds future quotes
				
				var h_length = history_date_range.length;
				//populate history range
				for (var x=0 ; x < h_length; x++ ){
						arr1._data[x][0] = tickers_history_quotes[ticker][x][0]*1000;
						arr1._data[x][1] = tickers_history_quotes[ticker][x][1];
						arr2._data[x][0] = tickers_history_quotes[ticker][x][0]*1000;
						arr2._data[x][1] = null;
				}   

				arr2._data[h_length-1][1] = tickers_history_quotes[ticker][h_length-1][1];
				
				//popula date future range
				for (var x=0; x<date_arr.length; x++ ){
					arr1._data[x + h_length][0] = date_arr[x]*1000;
					arr1._data[x + h_length][1] = null;
					arr2._data[x + h_length][0] = date_arr[x]*1000;
					arr2._data[x + h_length][1] = future_arr._data[x][1];					
				}	
			
				var company = $("#stockSelect1").children("option").filter(":selected").text();
				//PredictionChart(arr1, arr2, "portfolio", "value") ;
				predictionChart(arr1, arr2, company ,"predictChart");				
}

// calculate monte carlo comparison
function calculate_sell_simulator(ticker){
				var symbol;
				var readings = slider_m1.getValue();
				var monte_prices = []; //  holds random growth
				var temp_price;
				var temp_growth_arr = [];
				var date_arr = [];
				var temp_daily_growth_mean, temp_daily_growth_std, temp_daily_growth_drift ;
								
				// set global std_dev value				
				std_dev = slider_m2.getValue();
				
				//get the ticker object
				var myobj = $.grep(portfolio.info,function(obj){return obj.Symbol == ticker})

				// get last price and date
				var last_date = myobj[0].daily_prices[myobj[0].daily_prices.length - slider_m1.getValue() - 1][0];
				var last_price = myobj[0].daily_prices[myobj[0].daily_prices.length - slider_m1.getValue() - 1][1];	
				
				//slice temp_growth
				temp_growth_arr = myobj[0].growth_arr.slice(0, myobj[0].growth_arr.length - slider_m1.getValue());
				
				temp_daily_growth_mean        = vector_mean(temp_growth_arr);
				temp_daily_growth_std         = vector_stdev(temp_growth_arr);
				temp_daily_growth_drift       = temp_daily_growth_mean - (Math.pow(temp_daily_growth_std,2)/2)
				
				// create monte prices
				temp_price = last_price;
				max_monte   = last_price;
				min_monte   = last_price;
				monte_prices.push(temp_price);
				
				for(var x = 0 ; x < readings; x++){					
					temp_price =  monte_carlo(temp_price, temp_daily_growth_drift , temp_daily_growth_std);
					if(temp_price > max_monte){max_monte = temp_price};
					if(temp_price < min_monte){min_monte = temp_price};
					monte_prices.push(temp_price)
				}// end for

				
				// add to summary table
				sim_counter++;
				monte_sim_arr._data[sim_counter][0]	= sim_counter;
				monte_sim_arr._data[sim_counter][1]	= n(min_monte);
				monte_sim_arr._data[sim_counter][2]	= n(max_monte);
				monte_sim_arr._data[sim_counter][3]	= n(temp_price);
				monte_sim_arr._data[sim_counter][4]	= myobj[0].daily_prices[myobj[0].daily_prices.length - 1][1];
				monte_sim_arr._data[sim_counter][5]	= ps(myobj[0].daily_prices[myobj[0].daily_prices.length - 1][1]/numeral(temp_price)._value - 1);

				var arr1 = initialize_two_dim_array(myobj[0].daily_prices.length, 2); // holds original quotes
				var arr2 = initialize_two_dim_array(myobj[0].daily_prices.length, 2); // holds monte carlo quotes 

				// create two segments of dates
				var h_length = myobj[0].daily_prices.length - slider_m1.getValue() - 1;
					
				// populate arr1 and arr2
				myobj[0].daily_prices.map(function(el,idx){
					// full date range is common to both arrays
					arr1._data[idx][0] = moment(myobj[0].daily_prices[idx][0]).format("X")*1000;
					arr2._data[idx][0] = moment(myobj[0].daily_prices[idx][0]).format("X")*1000;
					// handle prices
					// arr1 - original prices for the full date range
					arr1._data[idx][1] = myobj[0].daily_prices[idx][1];
					// arr2 - split range
					(idx < h_length) ? arr2._data[idx][1] = null: arr2._data[idx][1] = monte_prices[idx - h_length ];
				});
							
				var company = $("#stockSelect1").children("option").filter(":selected").text();
				//PredictionChart(arr1, arr2, "portfolio", "value") ;
				predictionChart(arr1, arr2, company ,"MonteChart");				
}

function get_corralation_table(){
	
	var arr = [];
	
	arr = initialize_two_dim_array(portfolio._correlation._data.length,portfolio._correlation._data.length)

	for(var i=0; i < portfolio._correlation._data.length; i++){
		for( var b=i; b < portfolio._correlation._data.length ; b++){
			arr._data[b][i] = portfolio._correlation._data[b][i]
		}
	}	

	return arr._data;
}

function get_corralation_text(style){

		var cor_text;
		
		switch(style){
			case "background: green;":
				cor_text = "Low Correlation";
				break;
			case "background: yellow;":
				cor_text = "Medium Correlation";
				break;
			case "background: orange;":
				cor_text = "High Correlation";
				break;
			case "background: red;":
				cor_text = "Very Strong Correlation";
				break;	
		}
		
		return cor_text;
}

function company_name(symbol){
	
	 var c_name;
	 var current_quote = [];
	 
	if (symbol != "portfolio"){
		 current_quote = $.grep(portfolio.info, function(e){ return e.Symbol == symbol; });
		 c_name = current_quote[0].current_quote["quoteSummary.result.0.price.longName"];
	}
	else{
		c_name = "Portfolio";
	}
	 
	return c_name;
}

function calc_exchange_rate(){
		var cur_pair = [];
		cur_pair.push($("#f_cur").val()+$("#t_cur").val());
		$("#t_sym").text(curSym[$("#t_cur").val()]);
		get_Rate_Exchange(cur_pair,"rates");
		if(!currency_history_obj[cur_pair[0]]){
			get_pairRxHistory(cur_pair);
		}
		else{
			// prepare for display array
			two_dim_arr = [];
			two_dim_arr = currency_history_obj[cur_pair[0]];
			if(tb_rx){
				tb_rx.destroy();
				$("#rxTB").empty();
			}
			create_table("_rate_exchange");			
			//create chart
			$("#rxChart").empty()
			var symbol = cur_pair[0].substring(0,3) + " " + cur_pair[0].substring(3,6);
			rate_exchange_chart(symbol,"rxChart");
		}	
}

function hide_pf(){
			$('#tblPortfolioM_wrapper thead tr th:nth-child(17)').css("display","none");
			$('#tblPortfolioM_wrapper tbody tr td:nth-child(17)').css("display","none");
			$('.dataTables_scrollFoot table tfoot tr th:nth-child(17)').css("display","none");
						
}

// reset quote table and quote chart
function reset_quote(){		
				$(".stock_info_txt").text('');
				$("#add2portfolio").css('visibility', 'hidden');
				$("#quote_tbl tbody").empty();
				$("#SymbolChart").empty();
				$("#symbol_name").empty();
				$("#exchange_info").empty();
										
}


function reset_portfolio(){
			portfolio_ready = false;
			$('#tblPortfolioM_wrapper thead tr th:nth-child(17)').css("display","none");
			$('#tblPortfolioM_wrapper tbody tr td:nth-child(17)').css("display","none");
//			$('#tblPortfolioM_wrapper tfoot').attr('style', 'display:none;');
			$('.dataTables_scrollFoot table tfoot tr th:nth-child(17)').css("display","none");
			$("#buildPortfolio").removeAttr("disabled");
			$("#buildPortfolio").addClass("btn btn-success"); 
			$("#buildPortfolio").text("Analyse Portfolio");
			$("#buildPortfolio i").remove();
			$("#remove_rec").css("visibility","hidden");
			$("#remove_all").css("visibility","hidden");
			
}

// check if symbol currency in cents (like GBp)

function currency_denominator(currency){
	
		var divider;
		(currency=="GBp" || currency=="GBP" || currency=="ILS" ) ?divider=100: divider=1;
		return divider;
}	

