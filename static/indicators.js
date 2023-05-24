function add_condition(and_or,BuySell){
    _condition_div = `<div class="condition_wrapper" id="`+BuySell+`_condition_`+_condition_no+`" data-id=`+_condition_no+` style="margin-left:55px;") >
    <form class="form-inline">
      <div class="form-group">
        <label for="`+BuySell+`_strategy_attr_lh_`+_condition_no+`">`+and_or+` :</label>
          <select class="selectpicker"  id="`+BuySell+`_strategy_attr_lh_`+_condition_no+`" data-width="fit" name="showHide"   data-container="body" title="Indicator:">
          </select>
      </div>
      <div class="form-group">
        <label for="`+BuySell+`_strategy_condition_`+_condition_no+`">is :</label>
          <select class="condition"  id="`+BuySell+`_strategy_condition_`+_condition_no+`" data-width="fit" name="showHide"   data-container="body" title="Condition:">
                     <option value="gt">greater than:</option>
                     <option value="lt">lower than:</option>
          </select>
      </div>
      <div class="form-group">
          <select class="selectpicker"  id="`+BuySell+`_strategy_attr_rh_`+_condition_no+`" data-width="fit" name="showHide"   data-container="body" title="Value Of:">
          </select>
      </div>
      <button type="button" id="`+BuySell+`_delete_condition_`+_condition_no+`" name="delete_`+BuySell+`_cond" class="del btn btn-danger" data-id=`+_condition_no+`>Delete Condition</button>
    </form>
    </div>`
    // Apend to strategy conditions
    let strategy_div = "#"+BuySell+"_conditions";
    $(strategy_div).append(_condition_div);


    /////////

    	//populate strategy left hand side - indicator 1
      $.each(_tech_indicators, function(index, value) {
        $("#"+BuySell+"_strategy_attr_lh_"+_condition_no+".selectpicker").append("<option value="+index+">"+value.name+"</option>")
        $("#"+BuySell+"_strategy_attr_lh_"+_condition_no+".selectpicker").selectpicker('refresh');
        });

    //populate right hand condition
    $("#"+BuySell+"_strategy_attr_lh_"+_condition_no+".selectpicker").on('change', function() {
            _indicator = this.value;
            populate_strategy_rh("#"+BuySell+"_strategy_attr_rh_"+_condition_no)
    });
}


var _tech_indicators_old = {
'MACD':{
        name:'MACD',
        condition_tp:'V',
        condition:[['greater than','lower than'],['signal','0']],
        tech: 'pd.DataFrame(quotes["Close"]).ta.macd()',
        eval: 'df["MACD"][-1]'
    },
 'P_MACD':{
        name:'Previous MACD',
        condition_tp:'V',
        condition:[['greater than','lower than'],['signal','0']],
        tech: 'quotes["MACD"].shift(1)',
        eval: 'df["MACD"][-2]'
    },
'RETURN':{
        name:'Price Change (%)',
        condition_tp:'V',
        condition:[['greater than','lower than'],[0.1,0.3,0.5,0.7,1,1.5,3]],
        tech: 'quotes.Close.pct_change()',
        eval: 'df["RETURN"][-1]'
    },
'CLOSE':{
        name:'Current Closing Price',
        condition_tp:'I',
        condition:[['greater than','lower than'],['OPEN','P_OPEN','P_CLOSE','MA10','MA100','MAX50','AVG50']],
        tech: 'quotes.Close',
        eval: 'df["Close"][-1]'
},
'P_CLOSE':{
        name:'Previous Closing Price',
        condition_tp:'I',
        condition:[['greater than','lower than'],['OPEN','P_OPEN','CLOSE','MA10','MA100','MAX50','AVG50']],
        tech: 'quotes.Close.shift(1)',
        eval: 'df["P_Close"][-1]'
    },
'OPEN':{
        name:'Current Opening Price',
        condition_tp:'I',
        condition:[['greater than','lower than'],['P_OPEN','CLOSE','P_CLOSE','MA10','MA100','MAX50','AVG50']],
        tech: 'quotes.Open',
        eval: 'df["Open"][-1]'
},
'P_OPEN':{
        name:'Previous Opening Price',
        condition_tp:'I',
        condition:[['greater than','lower than'],['OPEN','CLOSE','P_CLOSE','MA10','MA100','MAX50','AVG50']],
        tech: 'quotes.Open.shift(1)',
        eval: 'df["P_Open"][-1]'
    },
'RSI':{
        name:'Relative Strength Index',
        condition_tp:'V',
        condition:[['greater than','lower than'],[20,30,40,50,60,70,80]],
        tech: 'pd.DataFrame(quotes["Close"]).ta.rsi(length=14)',
        eval: 'df["RSI"][-1]'
    },
'P_RSI':{
        name:'Previous Relative Strength Index',
        condition_tp:'V',
        condition:[['greater than','lower than'],[20,30,40,50,60,70,80]],
        tech: 'pd.DataFrame(quotes["Close"]).ta.rsi(length=14).shift(1)',
        eval: 'df["P_RSI"][-1]'
    },
'MA10':{
        name:'Moving Average 10 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA100','MAX50','AVG50']],
        tech: 'quotes["Close"].rolling(10).mean()',
        eval: 'df["MA10"][-1]'
    },
 'P_MA10':{
        name:'Previous Moving Average 10 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA100','MAX50','AVG50']],
        tech: 'quotes["Close"].rolling(10).mean().shift(1)',
        eval: 'df["P_MA10"][-1]'
    },
'MA100':{
        name:'Moving Average 100 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA10']],
        tech: 'quotes["Close"].rolling(100).mean()',
        eval: 'df["MA100"][-1]'
     },
'P_MA100':{
        name:'Previous Moving Average 100 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA10']],
        tech: 'quotes["Close"].rolling(100).mean().shift(1)',
        eval: 'df["P_MA100"][-1]'
    },
'MAX50':{
        name:'Max price 50 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA100','AVG50']],
        tech: 'quotes["Close"].rolling(50).max()',
        eval: 'df["MAX50"][-2]'
    },
'AVG50':{
        name:'Average price 50 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA100','MAX50']],
        tech: 'quotes["Close"].rolling(50).mean()',
        eval: 'df["AVG50"][-2]'
    },
}

/*
'MA10':'Moving Average 10 periods',
'MA25':'Moving Average 25 periods',
'MA50':'Moving Average 50 periods',
'MA75':'Moving Average 75 periods',
'MA100':'Moving Average 100 periods',
'RSI': 'Current RSI',
'P_RSI': 'Previous RSI',
'VOLUME': 'Volume',
'OPEN':'Open Price',
'HIGH':'Highest Price',
'LOW' :'Lowest Price',
'CLOSE':'Close Price',
'UPBOL' : 'Bollinger Upper Band',
'MIDBOL' : 'Bollinger Middle Band',
'LOWBOL' : 'Bollinger Lower Band',
'EMA10':'Exponential Moving Average 10 periods',
'EMA25':'Exponential Moving Average 25 periods',
'EMA50':'Exponential Moving Average 50 periods',
'EMA75':'Exponential Moving Average 75 periods',
'EMA100':'Exponential Moving Average 100 periods',
'ATR' : 'Average True Range',
};

*/

var _template_momentum = {
    count_buy_rules : 3,
    buy_rule_1:{
        left:"CLOSE",
        comp:"gt",
        right:'MA100'
    },
    buy_rule_2:{
        and_or:"and",
        left:"RSI",
        comp:"gt",
        right:'70'
    },
    buy_rule_3:{
        and_or:"or",
        left:"CLOSE",
        comp:"gt",
        right:'P_OPEN'
    },
    count_sell_rules : 2,
    sell_rule_1:{
        left:"RSI",
        comp:"lt",
        right:'50'
    },
    sell_rule_2:{
        and_or:"and",
        left:"CLOSE",
        comp:"lt",
        right:'P_OPEN'
    }
};

var _template_pressure = {
    count_buy_rules : 1,
    buy_rule_1:{
        left:"RSI",
        comp:"gt",
        right:'60'
    },
    count_sell_rules : 1,
    sell_rule_1:{
        left:"RSI",
        comp:"lt",
        right:'40'
    }
}