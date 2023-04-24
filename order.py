from datetime import *
import wallet

class order:
    def __init__(self,o_type,broker,token,price, amount, wallet):
        self._o_type = o_type
        self._broker = broker
        self._token = token
        self._price = price
        self._amount = amount
        self._wallet = wallet
        self._client = {} #todo: consider remove

#test binance buy,sell order
    def _test_buy_order(self,pair, qty):
        try:
            passed = True
            buy_order = self._client.create_test_order(symbol=pair, side='BUY', type='MARKET', quantity=qty)
            res = buy_order
        except BaseException as e:
            passed = False
            res = e
        return passed, res

    def _test_sell_order(self,pair, qty):
        try:
            test = True
            sell_order = self._client.create_test_order(symbol=pair, side='SELL', type='MARKET', quantity=qty)
        except:
            test = False
        return test


    def _now(self):
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def _buy_demo(self):
        self._wallet._add_to_token(self._token, self._amount, self._price)
        return None


    def _sell_demo(self):
        self._wallet._deduct_from_token(self._token,self._amount,self._price)
        return None

