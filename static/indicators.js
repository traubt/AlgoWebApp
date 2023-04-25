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
                     <option>greater than:</option>
                     <option>lower than:</option>
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


var _tech_indicators = {
'MACD':{
        name:'MACD',
        condition_tp:'I',
        condition:[['greater than','lower than'],['signal','zero']],
        tech: 'btalib.macd(quotes[pair].Close, pfast=12, psLow=26, psignal=9)'
    },
 'P_MACD':{
        name:'Previous MACD',
        condition_tp:'I',
        condition:[['greater than','lower than'],['signal','zero']],
        tech: 'btalib.macd(quotes[pair].Close, pfast=12, psLow=26, psignal=9)'
    },
'RETURN':{
        name:'Price Change (%)',
        condition_tp:'V',
        condition:[['greater than','lower than'],[0.1,0.3,0.5,0.7,1,1.5,3]],
        tech: 'quotes[pair].Close.pct_change()'
    },
'CLOSE':{
        name:'Current Closing Price',
        condition_tp:'I',
        condition:[['greater than','lower than'],['P_CLOSE','MA10','MA100','MAX50','AVG50']],
        tech: 'quotes[pair].Close'
},
'P_CLOSE':{
        name:'Previous Closing Price',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA10','MA100','MAX50','AVG50']],
        tech: 'quotes[pair].Close.shift(1)'
    },
'RSI':{
        name:'Relative Strength Index',
        condition_tp:'V',
        condition:[['greater than','lower than'],[20,30,40,50,60,70,80]],
        tech: 'btalib.rsi(quotes[pair].Close, period=9).df'
    },
'P_RSI':{
        name:'Previous Relative Strength Index',
        condition_tp:'V',
        condition:[['greater than','lower than'],[20,30,40,50,60,70,80]],
        tech: 'btalib.rsi(quotes[pair].Close, period=9).df'
    },
'MA10':{
        name:'Moving Average 10 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA100','MAX50','AVG50']],
        tech: 'btalib.sma(quotes[pair].Close, period=10)'
    },
 'P_MA10':{
        name:'Previous Moving Average 10 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA100','MAX50','AVG50']],
        tech: 'btalib.sma(quotes[pair].Close, period=10)'
    },
'MA100':{
        name:'Moving Average 100 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA10']],
        tech: 'btalib.sma(quotes[pair].Close, period=100)'
     },
'P_MA100':{
        name:'Previous Moving Average 100 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA10']],
        tech: 'btalib.sma(quotes[pair].Close, period=100)'
    },
'MAX50':{
        name:'Max price 50 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA100','AVG50']],
        tech: 'btalib.sma(quotes[pair].Low, period=10)'
    },
'AVG50':{
        name:'Average price 50 periods',
        condition_tp:'I',
        condition:[['greater than','lower than'],['CLOSE','MA100','MAX50']],
        tech: 'btalib.sma(quotes[pair].Low, period=10)'
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
'RETURN': 'Percent Increased'
};

*/