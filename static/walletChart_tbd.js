//
//function monitor_wallet_chart() {
//     setInterval(() => {
//      var prev_amount;
//      // update line series if in algo mode
//      if(!_inPosition ){ //No position in
//            _lineSeries.update({
//                time: Math.round((Date.now()/1000),0),
//                value: _wallet[user][0].free,
//            });
//            $("#balance").html("$"+_wallet[user][0].free);
//            _wallet[user][0].free >= _init_wallet_amount ? $("#balance").css("color","green"):$("#balance").css("color","red");
//       }
//       else{
//           let qty = _wallet[user].find(x => x.asset === _symbol).free;
//           if(_candlestick.close){
//                   current_price = _candlestick.close;
//                   let amount  = math.round(current_price * qty,2);
//                   let ratio = amount/prev_amount
//                   if(ratio < 2 & ratio > 0.5 ){
//                       console.log("Wallet: "+get_current_date()+' Token: '+_symbol+' Value: '+amount+' Prev Value: '+prev_amount)
//                                   _lineSeries.update({
//                                        time: Math.round((Date.now()/1000),0),
//                                        value: amount,
//                                });
//                       $("#balance").html("$"+amount);
//                       amount > _init_wallet_amount ? $("#balance").css("color","green"):$("#balance").css("color","red");
//                       prev_amount = amount // to avoid price glitch because lag in _candlestick price
//                   }
//           }
//       };
//},2000);
//};
