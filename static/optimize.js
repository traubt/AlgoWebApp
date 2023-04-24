// Optimize portfolio

function optimize_portfolio(){   // work on one option : max return over min STD. later add drop STD without dropping return

	var weight						= 	[]; // holds the recommended weights
	var temp_weight 				= []; // holds the recommended weights
	var solved 						= false; // check if solution found
	var target_std,	temp_std		= 0 ;  // Fix risk from portfolio
	var target_return, temp_return  	= 0	;  // holds the target return
	var optimize_obj 				= {};
	var runs						= 1000; // how many simulations
	var temp_s_ratio				= 0;
	
	//set parameters
	target_std 		= portfolio._std_dev;
	temp_std 		= target_std;
	target_return	= portfolio._mean;
	temp_return		= target_return;
	temp_s_ratio	= portfolio._s_Ratio;
	// initialize optimize_obj 
	optimize_obj._weight 		= portfolio._wgt_arr._data;
	optimize_obj._solved 		= solved;
	optimize_obj._target_std 	= target_std; 
	optimize_obj._target_return = target_return;
        
	
	for (var x = 0 ; x < runs ; x++ ){
			// for (var i = 0; i < portfolio._count_tickers; i++){
				// weight.push(Math.random())   // set different values
			// }
			weight = Array.apply(null, Array(portfolio._count_tickers - 1)).map(function(){return Math.random()})
			weight.push(0,1);
			weight.sort();
			temp_weight = weight.map(function(el, i, arr){return arr[i+1] - arr[i]});
			temp_weight.splice(portfolio._count_tickers , 1);
			
			// calculate portfolio STD
			temp_std = portfolio_stdev(portfolio._covariance._data , temp_weight);
			// calculate portfolio return
			temp_return = math.multiply(portfolio._mean_arr, temp_weight);
                        
			
			if ( temp_std <= optimize_obj._target_std && temp_return > optimize_obj._target_return){
				optimize_obj._target_std 		= temp_std;
				optimize_obj._target_return     = temp_return; 
				optimize_obj._s_ratio            = (temp_return - 0.001) / temp_std ;
				optimize_obj._solved 			= true;
				optimize_obj._weight			= temp_weight;
								
			};
			
			weight = [];
			temp_weight = [];
	}
		
	return optimize_obj;	
}

function eq_balance_portfolio(eq_wgt_arr){   

	var temp_std 	;
	var temp_return	;
	var temp_weight 	= [];
	var optimize_obj 	= {};

			// calculate portfolio STD
			temp_std = portfolio_stdev(portfolio._covariance._data , eq_wgt_arr); 
			// calculate portfolio return
			temp_return = math.multiply(portfolio._mean_arr, eq_wgt_arr);
                        
			

				optimize_obj._target_std 		= temp_std;
				optimize_obj._target_return     = temp_return;  
				optimize_obj._s_ratio            = (temp_return - 0.001) / temp_std ;
				optimize_obj._solved 			= true;
				optimize_obj._weight			= eq_wgt_arr;
				
	return optimize_obj;
	
}