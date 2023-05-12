const run_algo = async (symbol) => {
        if (_asset == 'stocks'){
          get_current_stock_quote(symbol)
        }
        else{
        _binanceSocket = new WebSocket("wss://stream.binance.com:9443/ws/"+symbol.toLowerCase()+"@kline_"+_b_time_res[_time_res]);
        _binanceSocket.onmessage = async function (event) {
        // get indicators
        _klinedata = await getData();
            _message = JSON.parse(event.data);
            _candlestick = _message.k;
        }
            // update candles and indicators
//            _candleseries.update({
//                time: _candlestick.t / 1000,
//                open: _candlestick.o,
//                high: _candlestick.h,
//                low: _candlestick.l,
//                close: _candlestick.c
//            });
//             _volume_series.update({
//                  time: _candlestick.t / 1000,
//                  value: _candlestick.v,
//                  color: _candlestick.c > _candlestick.o ?   "#26A69A" : "#EF5350",
//            })
// update indicators
//                let d = _klinedata[_klinedata.length-1]
//                _sma_series.update({ time: d.time, value: d.sma });
//                _ema_series.update({ time: d.time, value: d.ema });
//                _macd_slow_series.update({ time: d.time, value: d.macd_slow });
//                _macd_fast_series.update({ time: d.time, value: d.macd_fast });
//                _rsi_series.update({ time: d.time, value: d.rsi });
//                _macd_histogram_series.update({
//                                                  time: d.time,
//                                                  value: d.macd_histogram,
//                                                  color: d.macd_histogram > 0 ?  "#26A69A" : "#EF5350",
//                                                });
        }
    }

function _init_user_wallet_test(){
  _wallet[user] = [];
  _token = {'asset': _coin,'free':_init_wallet_amount,'locked':0,'st_price':_init_wallet_amount};
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
              // update algo record
              prepare_algorun_db();
              update_algorun_db();
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
				  url: "http://127.0.0.1:5000/update_cell_no",
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
				  url: "http://127.0.0.1:5000/test_twilio",
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
		$.ajax({
		                 type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(_algo_params),
                dataType: 'json',
				  url: "http://127.0.0.1:5000/crypto_bot",
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
				  url: "http://127.0.0.1:5000/stop_bot",
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
				  url: "http://127.0.0.1:5000/update_algorun_db",
				})
		 .done(function(data) {
		    console.log("Record was updated successfully.")
		  }) // end successful ajax .done
  }
  catch(e){
		dialog('Error', e ,BootstrapDialog.TYPE_DANGER);

  }
}

function get_plans(){
  try
  {
       //dialog("Algo Engine","Starting Algo Engine for market: "+_asset ,BootstrapDialog.TYPE_INFO);
		$.ajax({
		        type: 'GET',
				 url: "http://127.0.0.1:5000/get_algo_plans",
				})
		 .done(function(data) {
//		    let plans = JSON.parse(data)
		    console.log(JSON.parse(JSON.stringify(data)))
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
		        type: 'GET',
				 url: "http://127.0.0.1:5000/get_user_info",
				})
		 .done(function(data) {
//		    let plans = JSON.parse(data)
		    console.log(JSON.stringify(data))
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
				 url: "http://127.0.0.1:5000/get_query",
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
        fetch('http://localhost:5000/get_query?query='+sqlQuery).then(
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