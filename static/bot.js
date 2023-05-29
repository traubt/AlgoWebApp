var _time_frame = `<label for="tfChart" class="tf_secondary"></label>
                     <select class="flex-item" id="tfChart" name='Timeframe'>
                        <option value="1" selected>1min</option>
                        <option value="5">5min</option>
                        <option value="15" >15min</option>
                        <option value="30">30min</option>
                        <option value="60">1hr</option>
                        <option value="120">2hr</option>
                        <option value="240">4hr</option>
                        <option value="D">1day</option>
                        <option value="W">1week</option>
                    </select>`

function _init_user_wallet_test(){
  _wallet[user] = [];
//  _token = {'asset': _coin,'free':_init_wallet_amount,'locked':0,'st_price':_init_wallet_amount};
  _token = {'asset': _coin,'free':_user_wallet[0][4],'locked':0,'st_price':_user_wallet[3]};
  _wallet[user].push(_token);
  _base_coin_qty = _wallet[user][0].free
}

// prepare payload to update the user_algorun table in each sell transaction
function prepare_algorun_db(){
    var trx_table = _trx_table.rows().data().toArray();
    var jsonTrxTable = JSON.stringify(trx_table);
    var stats_table = _stat_table.rows().data().toArray();
    var jsonStatsTable = JSON.stringify(stats_table);
    _algorun['strategy'] = _strategy_method == "SYSTEM" ? "SYSTEM" :_algo_params["ruleName"];
    _algorun["transactions"] = jsonTrxTable;
    _algorun["summary"] = jsonStatsTable;
}


function _transaction_order_demo(token, price, qty,mode){
    try{
        let trx_fee_rate = Number($("#trx_fee").val())/100;
        if(_order_type == "BUY"){

                _wallet[user][0].free = 0

              //2. update/create new token
                if(!_wallet[user].find(x => x.asset === token)){ // create new token
                    _token = {'asset': token,'free':qty,'locked':0,'st_price':price};
                    _wallet[user].push(_token);
                }else{ // Update existing token
                    _wallet[user].find(x => x.asset === token).free = qty;
                    _wallet[user].find(x => x.asset === token).st_price = price
                }
                let trx_fee = trx_fee_rate * price * qty;
                let balance = price*qty - trx_fee;
                _trx_table.row.add([get_current_date(),'TEST',_asset,_order_type,mode,token,math.round(price,3),math.round(qty,8),math.round(price*qty,2),0,math.round(trx_fee,2),0,0,math.round(price*qty-trx_fee,2)]).draw();
                $("#o_type").html("BUY Order is triggered");
               $("#order_content").html("Asset: "+token+"<br>Quantity: "+math.round(qty,8)+"<br>Price: "+math.round(price,8));
              _inPosition = true;
        }
        if (_order_type == "SELL"){
//               console.log("Sell:",token,price, qty);
              // update wallet
              //1. add base coin
               _wallet[user][0].free = math.round(price*qty,2)
              //2. Update current token amount
              _wallet[user].find(x => x.asset === token).free = 0;
              let start_price = math.round(_wallet[user].find(x => x.asset === token).st_price,8);
              let duration = (new Date(get_current_date()) - new Date(_trx_table.row(_trx_table.page.info().recordsTotal-1).data()[0]))/1000;
              let trx_fee = trx_fee_rate * price * qty;
              let balance = price*qty - trx_fee;
                _trx_table.row.add([get_current_date(),'TEST',_asset,_order_type,mode,token,math.round(price,3),math.round(qty,8),math.round(price*qty,2),duration,math.round(trx_fee,2),math.round(price*qty - start_price*qty - trx_fee,2),math.round((price/start_price)*100-100,2),_wallet[user][0].free]).draw()
               $("#o_type").html("SELL Order is triggered");
               $("#order_content").html("Asset: "+token+"<br>Quantity: "+math.round(qty,8)+"<br>Bought at Price: "+math.round(start_price,8)+
              "<br>Sell at Price: "+math.round(price,8)+"<br>P&L: "+math.round((price/start_price)*100-100,2)+"%");
              update_stats_table();
              // update db record
              prepare_algorun_db();
              update_algorun_db();
              update_user_wallet(balance);
              _inPosition = false;
        }
        _trx_table.page('last').draw('page');
      }
    catch(e){
        dialog('Error',"bot._transacton_order_demo:\n\n" + e ,BootstrapDialog.TYPE_DANGER);
    }
}

function update_cell_no(cell){
  try
  {
		$.ajax({
				  method: "GET",
				  url: _URL+"/update_cell_no",
				  data: {
				            cell_no: cell,
						}
				})
		 .done(function(data) {
//		    alert("Twilio test message: "+data)
		  }) // end successful ajax .done
  }
  catch(e){
		dialog('Error', e ,BootstrapDialog.TYPE_DANGER);

  }
}

function test_twilio(cell,key,password){
  try
  {
		$.ajax({
				  method: "GET",
				  url: _URL+"/test_twilio",
				  data: {
				            c: cell,
							k : key,
							p : password
						}
				})
		 .done(function(data) {
		    alert("Twilio test message: "+data+".\r\n If you did not receive a message to your cell\,\nplease activate you twilio messaging by sending your private message code to:\n Twilio Sandbox (+141455238886 e.g. 'Join futher-six')");
		    if (data = 'Success'){
		        update_cell_no(cell);
		    }
		  }) // end successful ajax .done
  }
  catch(e){
		dialog('Error', e ,BootstrapDialog.TYPE_DANGER);

  }
}

function run_bot(){
  try
  {
//        dialog("Algo Engine","Starting Algo Engine for market: "+_asset ,BootstrapDialog.TYPE_INFO);
        _algo_params["walletInitBalance"] = _user_wallet[0][4];
		$.ajax({
		                 type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(_algo_params),
                dataType: 'json',
				  url: _URL+"/crypto_bot",
				})
		 .done(function(data) {
		   console.log("Algo engine run has completed successfully.")
		  }) // end successful ajax .done
  }
  catch(e){
		dialog('Error', e ,BootstrapDialog.TYPE_DANGER);

  }
}

function stop_crypto_bot(){
  try
  {
        dialog("Algo Engine","Stopping Algo Engine " ,BootstrapDialog.TYPE_INFO);
		$.ajax({
				  method: "GET",
				  url: _URL+"/stop_bot",
				  data: {
                            action: "Stop"
						}
				})
		 .done(function(data) {
		    console.log("Bot stopped successfully: ")
		    $("#crytpoInfo").prop("disabled", false);
		  }) // end successful ajax .done
  }
  catch(e){
		dialog('Error', e ,BootstrapDialog.TYPE_DANGER);

  }
}


function update_algorun_db(){
  try
  {
       //dialog("Algo Engine","Starting Algo Engine for market: "+_asset ,BootstrapDialog.TYPE_INFO);
		$.ajax({
		        type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(_algorun),
                dataType: 'json',
				  url: _URL+"/update_algorun_db",
				})
		 .done(function(data) {
//		    console.log("Record was updated successfully.")
		  }) // end successful ajax .done

  }
  catch(e){
		dialog('Error', e ,BootstrapDialog.TYPE_DANGER);

  }
}

function get_plans(){
  try
  {
//        fetch('http://localhost:5000/get_algo_plans')
//        .then(r => r.json())
//          .then(data => {
//                    _plan = JSON.parse(JSON.stringify(data));
//                    console.log("I passed get algo plan successfully");
//          })

       //dialog("Algo Engine","Starting Algo Engine for market: "+_asset ,BootstrapDialog.TYPE_INFO);
		$.ajax({
		        type: "POST",
				 url: _URL+"/get_algo_plans",
				})
		 .done(function(data) {
//		    let plans = JSON.parse(data)
//		    console.log(JSON.parse(JSON.stringify(data)))
		    _plans = JSON.parse(JSON.stringify(data))
		  }) // end successful ajax .done
  }
  catch(e){
		dialog('Error', e ,BootstrapDialog.TYPE_DANGER);

  }
}

function get_user_info(){
  try
  {
       //dialog("Algo Engine","Starting Algo Engine for market: "+_asset ,BootstrapDialog.TYPE_INFO);
		$.ajax({
		        type: "POST",
				 url: _URL+"/get_user_info",
				})
		 .done(function(data) {
//		    let plans = JSON.parse(data)
//		    console.log(JSON.stringify(data))
		    _user_info = JSON.parse(JSON.parse(JSON.stringify(data)))
		  }) // end successful ajax .done
  }
  catch(e){
		dialog('Error', e ,BootstrapDialog.TYPE_DANGER);

  }
}


function get_query(sqlQuery){
  try
  {
		$.ajax({
		        type: 'GET',
				 url: _URL+"/get_query",
				 data: {query: sqlQuery}
				})
		 .done(function(data) {
            _query_output = data;
		    console.log("the output from async function is: "+data)

		  }) // end successful ajax .done
  }
  catch(e){
		dialog('Error', e ,BootstrapDialog.TYPE_DANGER);

  }
}

function exec_query(sqlQuery) {
    return new Promise(function (resolve, reject) {
        fetch(_URL+'/get_query?query='+sqlQuery).then(
            (response) => {
                var result = response.data;
                resolve(result);
                console.log('Processing Request');
            },
                (error) => {
                reject(error);
            }
        );
    });
}