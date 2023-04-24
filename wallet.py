from datetime import *

class wallet:
    def __init__(self,coin,amount):
        self.free = amount
        self._coin = coin
        self._token = {'asset': coin,'free':amount,'locked':0,'st_price':amount,'st_date': datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  # holds the token objects
        self._tokens = [self._token] # holds the list of coins in the wallet


    def _now(self):
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def _reset_wallet(self,coin, amount):
        self.__init__(coin,amount)
        return None

    def _get_wallet_balance(self):
        return sum(i['free'] for i in self._tokens)  #todo: will have to change this.

    def _add_new_token(self, token, amount, price):
        self._token = {'asset': token, 'free': amount, 'locked': 0, 'st_price': price,'st_date': self._now()}
        self._tokens.append(self._token)
        return None

    def _get_base_coin_balance(self):
        return float(self._tokens[0]['free'])

    def _get_token_location(self,token):
        return  next((index for (index, d) in enumerate(self._tokens) if d["asset"] == token), None)

    def _add_to_token(self, token, amount, price):
        #Check if new token
        if not self._get_token_location(token):
            self._add_new_token(token,amount,price)
            #update base token
            self._tokens[0]['free'] = 0
            self._tokens[0]['st_date'] = self._now()
        else:
            #update base token
            self._tokens[0]['free'] = 0
            self._tokens[0]['st_date'] = self._now()
            #add to existing token
            token_idx = self._get_token_location(token)
            self._tokens[token_idx]['free'] = amount
            self._tokens[token_idx]['price'] = price
            self._tokens[token_idx]['st_date'] = self._now()
        return None

    def _deduct_from_token(self, token, amount,price):
        self._tokens[0]['free'] = amount * price
        self._tokens[0]['st_date'] = self._now()
        # add to existing token
        token_idx = self._get_token_location(token)
        self._tokens[token_idx]['free'] = 0
        self._tokens[token_idx]['st_date'] = self._now()
        return None

    def _get_token_balance(self,token):
        token_idx = self._get_token_location(token)
        return float(self._tokens[token_idx]['free'])


    def _get_token_st_price(self,token):
        token_idx = self._get_token_location(token)
        return float(self._tokens[token_idx]['st_price'])

# function _init_user_wallet_test(){
#   _wallet[user] = [];
#   _token = {'asset': _coin,'free':100000,'locked':0,'st_price':100000};
#   _wallet[user].push(_token);
#   _base_coin_qty = _wallet[user][0].free
#
# }
# function _transaction_order_demo(token, price, qty){
#     try{
#         if(_order_type == "BUY"){
#               console.log("Buy:",token,price, qty);
#               // update wallet
#               //1. Deduct base coin
#                 _wallet[user][0].free = 0
#               //2. update/create new token
#                 if(!_wallet[user].find(x => x.asset === token)){ // create new token
#                     _token = {'asset': token,'free':qty,'locked':0,'st_price':price};
#                     _wallet[user].push(_token);
#                 }else{ // Update existing token
#                     _wallet[user].find(x => x.asset === token).free = qty;
#                 }
# //               dialog("Buy Order","Asset: "+token+"\nQuantity: "+math.round(qty,8)+"\nPrice: "+math.round(price,8),BootstrapDialog.TYPE_INFO);
#                 $("#o_type").html("BUY Order is triggered");
#                $("#order_content").html("Asset: "+token+"<br>Quantity: "+math.round(qty,8)+"<br>Price: "+math.round(price,8));
#               _inPosition = true;
#         }
#         if (_order_type == "SELL"){
#                console.log("Sell:",token,price, qty);
#               // update wallet
#               //1. add base coin
#                 _wallet[user][0].free = price/qty;
#               //2. Update current token amount
#               _wallet[user].find(x => x.asset === token).free = 0;
# //              dialog("Sell Order","Asset: "+token+"\nQuantity: "+math.round(qty,8)+"\nBought at Price: "+math.round(_wallet[user].find(x => x.asset === token).st_price,8)+
# //              "\nSell at Price: "+math.round(price,8)+"\nP&L: "+math.round((price/_wallet[user].find(x => x.asset === token).st_price)*100-100,2)+"%",BootstrapDialog.TYPE_INFO);
#                $("#o_type").html("SELL Order is triggered");
#                $("#order_content").html("Asset: "+token+"<br>Quantity: "+math.round(qty,8)+"<br>Bought at Price: "+math.round(_wallet[user].find(x => x.asset === token).st_price,8)+
#               "<br>Sell at Price: "+math.round(price,8)+"<br>P&L: "+math.round((price/_wallet[user].find(x => x.asset === token).st_price)*100-100,2)+"%");
#               _inPosition = false;
#         }
#
#       }
#     catch(e){
#         dialog('Error',"bot._transacton_order_demo:\n\n" + e ,BootstrapDialog.TYPE_DANGER);
#     }
# }