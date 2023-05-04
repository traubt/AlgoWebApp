from datetime import *
from dateutil.relativedelta import *
import pandas as pd
from tqdm import tqdm
from wallet import wallet
from order import order
import math
# import btalib
import time as tm
import pandas_ta as ta
import random
from flask import session
import os
import requests
import yfinance as yf
import bs4 as bs
import json
from flask_socketio import emit
from multiprocessing import Pool

count_msg = 0
interval = '15m'
period = '2d'


def printf(msg, msg_date,msg_price,msg_grow,order_type,msg_symbol,msg_qty,msg_amt,msg_sellRsn,msg_timeLapse,msg_fee):
    try:
        global count_msg
        count_msg = count_msg + 1
        message = msg.strip()
        msg_date = list(msg_date)[0]
        msg_price = list(msg_price)[0]
        msg_grow = msg_grow
        msg_type = order_type
        msg_symbol = list(msg_symbol)[0]
        msg_qty = list(msg_qty)[0]
        msg_amt = list(msg_amt)[0]
        msg_sellRsn = msg_sellRsn
        msg_timeLapse = msg_timeLapse
        emit('my_response',
                  {'data':message, 'count': count_msg,
                   'date':msg_date,
                   'price':msg_price,
                   'grow':msg_grow,
                   'type':msg_type,
                   'symbol':msg_symbol,
                   'qty':msg_qty,
                   'amt':msg_amt,
                   'sell_rsn':msg_sellRsn,
                   'time_lapse':msg_timeLapse,
                   'fee':msg_fee}, namespace='/', broadcast=True)
    except BaseException as e:
        print(f"error: {e} \n when trying to send messages: {msg}")
    return None

#print information to client
def printi(msg, msg_date,msg_price,msg_grow,order_type,msg_symbol,msg_qty,msg_amt,msg_sellRsn,msg_timeLapse,msg_fee):
    try:
        global count_msg
        count_msg = count_msg + 1
        message = msg.strip()
        msg_date = list(msg_date)[0]
        msg_price = float(list(msg_price)[0])
        msg_grow = float(list(msg_grow)[0])
        msg_type = order_type
        msg_symbol = msg_symbol
        msg_qty = msg_qty
        msg_amt = msg_amt
        msg_sellRsn = msg_sellRsn
        msg_timeLapse = msg_timeLapse
        emit('my_response',
                  {'data':message, 'count': count_msg,
                   'date':msg_date,
                   'price':msg_price,
                   'grow':msg_grow,
                   'type':msg_type,
                   'symbol':msg_symbol,
                   'qty':msg_qty,
                   'amt':msg_amt,
                   'sell_rsn':msg_sellRsn,
                   'time_lapse':msg_timeLapse,
                   'fee':msg_fee}, namespace='/', broadcast=True)
    except BaseException as e:
        print(f"error: {e} \n when trying to send messages: {msg}")
    return None

def _add_indicators(quotes):
    err = 0
    for pair in tqdm(quotes.keys()):
        try:
            # macd = btalib.macd(quotes[pair].Close, pfast=12, pslow=26, psignal=9)
            # Update Stochastic MA default parameters
            # sma_low = btalib.sma(quotes[pair].low, period=3)
            # sma_high = btalib.sma(quotes[pair].high, period=1)
            # Calculate stochastic with the new parameters
            # stoc = btalib.stochastic(quotes[pair].High,quotes[pair].Low,quotes[pair].Close)
            # Add bolinger bands
            # bbands = btalib.bbands(quotes[pair]['Close'])
            # Join the indicator to the main df
            # quotes[pair] = quotes[pair].join([macd.df, bbands.df])
            # quotes[pair] = quotes[pair].join([macd.df])
            # Add EMW
            # quotes[pair]['EMA'] = btalib.ema(quotes[pair].Close, period=emawdw).df
            quotes[pair]['EMA'] = quotes[pair]['Close'].ewm(span=7, adjust=False).mean()
            quotes[pair]['P_EMA'] = quotes[pair]['EMA'].shift(1)
            # quotes[pair]['EMA_ratio'] = quotes[pair]['EMA'] / quotes[pair]['mid']
            # quotes[pair]['Prev_EMA_ratio'] = quotes[pair]['EMA_ratio'].shift(1)
            # quotes[pair]['S_RSI'] = btalib.stochrsi(quotes[pair].Close).df
            # quotes[pair]['RSI'] = btalib.rsi(quotes[pair].Close, period=7).df
            quotes[pair]['RSI'] = quotes[pair].ta.rsi(length=14)
            quotes[pair]['P_RSI'] = quotes[pair]['RSI'].shift(1)
            quotes[pair]['CAPVOL'] = quotes[pair]['Volume'] * quotes[pair]['Close']
            # Add daily change
            # quotes[pair]['Change'] = quotes[pair].Close.pct_change()
            # quotes[pair]['min100'] = quotes[pair].Change.rolling(100).min()
            # quotes[pair]['min30'] = quotes[pair].Close.rolling(30).min()
            # ATR
            # quotes[pair]['ATR'] = btalib.atr(quotes[pair].High, quotes[pair].Low,
            #                                         quotes[pair].Close).df
            # quotes[pair]['max_ATR'] = quotes[pair]['ATR'].rolling(100).max()
            # quotes[pair]['Stop_Loss'] = quotes[pair]['Close'].shift(1) - quotes[pair]['ATR'].shift(1)
            # Max daily change
            # quotes[pair]['Prev_High'] = quotes[pair].High.shift(1)
            # quotes[pair]['Prev_Low'] = quotes[pair].Low.shift(1)
            # quotes[pair]['Max_Change'] = (quotes[pair][["High", "Prev_High"]].max(axis=1) - quotes[pair][["Low", "Prev_Low"]].min(axis=1)) / quotes[pair][["Low", "Prev_Low"]].min(axis=1)
            # Sharpe
            # ret = np.exp(quotes[pair].Change.rolling(44).mean() * 244) - 1
            # std = quotes[pair].Change.rolling(44).std() * np.sqrt(244)
            # quotes[pair]['Sharpe'] = (ret - 0.02) / std
        except BaseException as e:
            print(pair, " could not be obtained.", e)
            err += 1
            continue
    # print(f"{self._now()} Number of errors add indicators: {err}")
        return quotes
    return None

class equity_bot:
  def __init__(self,  time_frame, balance):

    self.pairs = []
    self.exclude = [] # list of symbols to exclude from running
    # self.client = client
    self.min_dl = (datetime.utcnow() + relativedelta(minutes=-5)).strftime("%Y-%m-%d %H:%M:%S")
    self.max_dl = (datetime.utcnow() + relativedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
    self.time_scale = '1m'
    self.quote_df = pd.DataFrame() # holds downloaded quote
    self.market_prices = {}
    self.top_last_min_gain = [] # list of top last min gainer (0.3%)
    self.top_gainers = [] # list of top gainers that pass find asset criteria
    self.found = False
    self._base_coin = 'USDT'
    self._default_amount = balance
    self._wallet = wallet(self._base_coin, self._default_amount)
    self._mode = 'TEST'
    self._cycle = 0

  def _now(self):
      return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

  def get_symbols(self):
      stockList = []
      pairs = []
      resp = requests.get(
          'https://www.ig.com/za/ig-proxy/marketscreener/filter?MKTCAP=[3000000000,)&PR13WKPCT=[3,)&PR26WKPCT=[2,)&PR52WKPCT=[2,)&country=US&sortField=name&sortDirection=ASC&page_number=1&page_size=450')
      soup = bs.BeautifulSoup(resp.text, features="lxml")
      res = soup.find('p').getText()
      js = json.loads(res)
      results = js['results']
      for item in results:
          ticker = item["maid"].strip('-US')
          stockList.append(ticker)

      #data cleaning
      pairs = [i for i in stockList if i]
      stockList = list(set(pairs))
      self.pairs = stockList
      # self.pairs =  random.sample(stockList,30)

  def downloadHistoryPricesNyse(self,stock, intrvl=interval, priod=period):
      quotes = yf.download(tickers=stock, interval=intrvl, period=priod)
      return quotes

  # def downloadHistoryPrices(self, pair):
      # self.quote_df = pd.DataFrame()
      # pair_prices = self.client.get_historical_klines(pair, self.time_scale, self.min_dl, self.max_dl)
      # # del unwanted data
      # for line in pair_prices:
      #     del line[6:]
      # # Convert to dataframe
      # self.quote_df = pd.DataFrame(pair_prices, columns=['Date', 'Open', 'High', 'Low', 'Close', 'Volume']).astype(float)
      # self.quote_df['Date'] = pd.to_datetime(self.quote_df['Date'], unit='ms')
      # self.quote_df.set_index('Date', inplace=True)

  def _get_market_data(self):
      # quotes = {}
      # history = pd.DataFrame()
      start_time = tm.time()
      with Pool(10) as p:
          try:
              res = p.map(self.downloadHistoryPricesNyse, self.pairs)
              self.market_prices = dict(zip(self.pairs, res))
          except BaseException as e:
              print("Error download quotes:",e)
              pass
      print("---Download completed in %s seconds ---" % (tm.time() - start_time))
      # for pair in tqdm(self.pairs):
      #     try:
      #         self.downloadHistoryPricesNyse(pair)
      #         quotes[pair] = self.quote_df
      #     except:
      #         continue
      # self.market_prices = quotes
      return None

  def _top_gainers_last_min(self):
      l = []
      for x in self.market_prices.keys():
          try:
              d = [0] * 3
              gain = round(self.market_prices[x]['Close'][-1] / self.market_prices[x]['Open'][-2] * 100 - 100, 2)
              capvol = int(self.market_prices[x]['Volume'][-2] * self.market_prices[x]['Close'][-2])
              # Alont Change gayin to gain>0.3
              if gain > 0.3:  # and gain < 3:
                  d[0] = x
                  d[1] = gain
                  d[2] = capvol
                  l.append(d)
          except:
              continue
      # get top last min gainer who broke 0.3%
      self.top_last_min_gain = [x[0] for x in sorted(l, key=lambda a: a[1], reverse=True)[:10]]

  def _find_asset(self,df, token):
      found = False
      try:
          price = df['Close'][-1]
          open = df.loc[:]['Open'][-2]
          history_max_price = df.loc[:].iloc[:-2]['Close'].max()
          history_avg_price = df.loc[:].iloc[:-2]['Close'].mean()
          max_ratio = price / history_max_price
          min_ratio = open / history_max_price
          max_avg_ratio = price / history_avg_price
          if (max_ratio > 1) and (min_ratio < 1) and (max_avg_ratio < 1.04):
              idx = df.loc[:].loc[(df['Close'] > open) & (df['Close'] < price)].index[-1]
              last = len(df) - df[:].index.get_loc(idx)
              print(f"{self.now} Breakout: {token} , Current price: {price}, Open: {open}, Break history at: {idx}, {last} minutes ago")
              printf(f"{self.now} Breakout: {token} , Current price: {price}, Open: {open}, Break history at: {idx}, {last} minutes ago",{self.now},{price},"NA"  ,"NA","NA","NA","NA","NA","NA","NA")
              found = True
      except BaseException as e:
          # print(f"error calculating rsi: {e}")
          None
      self.found = found

  def _download_1min_quotes(self,pair):
      quote = {}
      self.time_scale = '1m'
      self.min_dl = (datetime.utcnow() + relativedelta(hours=-1)).strftime("%Y-%m-%d %H:%M:%S")
      self.max_dl = (datetime.utcnow() + relativedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")


      self.downloadHistoryPrices(pair)
      quote[pair] = self.quote_df
      quote = _add_indicators(quote)

      return quote[pair]

  def _check_exit(self,pair, df, st_price):
      sell = False
      rsn = "IN"
      max_ret = 0
      max_ema = 0
      max_date = self._now()
      secure_ret = 0
      secure_ema = 0
      count_low_ema = 0

      print(f"{self._now()} {pair} Check price action every second.")

      interval = 1
      count_sec = 0

      while not sell:
          count_sec += 1

          d = self._download_1min_quotes(pair)
          ema = d['Close'].ewm(span=7, adjust=False).mean()
          # ratio = d.Close[-1] / last_price
          ratio = (ema[-1] / ema[-2] * 100) - 100
          rsi = round(d['RSI'][-1], 2)
          g = d.Close[-1] / df.Close[-1] * 100 - 100
          # print(f"{_now()} base grow: {round(dg,5)} time span: {round(dt,5)} sec, pace: {round(pace,5)} p/sec, stop_loss: {round(stop_loss,5)}, inter_sec ret: {round(ratio,5)}, Gain: {round(g,3)}%")
          # print(f"Token: {pair} EMA growth: {round(ratio, 2)}%, RSI: {rsi},Portfolio Growth: {round(g, 3)}%, Secure EMA: {secure_ema}%, Secure Return: {secure_ret}%.")
          txt = "Token: " + pair + " Price: " + str(round(d.Close[-1], 2)) + ", RSI: " + str(
              rsi) + ", Portfolio Growth: " + str(round(g, 3)) + "%, Max Return: " + str(
              round(max_ret, 3)) + "%, Secure Return: " + str(secure_ret) + "%."
          # logging.info(txt)
          print(txt)
          printi(f"{self._now()}  Token: {pair}  Price:  {str(round(d.Close[-1], 2))} , RSI:  {str(rsi)}  , Portfolio Growth: {str(round(g, 3))} %, Max Return: { str(round(max_ret, 3)) } %, Secure Return:  { str(secure_ret)} %.",
                 {self._now()},
                 {str(round(d.Close[-1], 2))},
                 {str(round(g, 3))},
                 "MONITOR",
                 pair,"NA","NA","NA","NA","NA")
          # save max return and date
          if (g > max_ret) and (g > 15):
              max_ret = g
              secure_ret = round(g * 0.9, 2)
              max_date = self._now()
          elif (g > max_ret) and (g > 10):
              max_ret = g
              secure_ret = round(g * 0.8, 2)
              max_date = self._now()
          elif (g > max_ret) and (g > 2):
              max_ret = g
              secure_ret = round(g * 0.7, 2)
              max_date = self._now()
          # Alont Secure profit start when > 0.5%
          # elif (g > max_ret) and (g > 1):
          elif (g > max_ret) and (g > 0.2):
              max_ret = g
              # Alont
              secure_ret = round(g * 0.7, 2)
              max_date = self._now()

          if ratio < 0.5:
              count_low_ema += 1
          # if ratio > max_ema:
          #     max_ema = ratio
          #     secure_ema = round(ratio*0.7,2)
          #     max_date = _now()

          ######### EXIT FROM POSITION #########

          # Droping down first seconds immediately after buy
          if (ratio < 0 or g < -0.2) and (rsi < 75) and (secure_ret == 0):
              print(f"{self._now()}:Trigger BED START {pair}")
              # printf(f"{self._now()}:Trigger BED START {pair}")
              sell = True
              # rsn = "EMA REVERSE OR DOWNFALL"
              rsn = "BED START"
              return sell, rsn, max_ret, max_date

          # No movement
          elif (count_sec > 30) and (secure_ret == 0):
              print(f"{self._now()}:Trigger 30 sec no movement for {pair}")
              # printf(f"{self._now()}:Trigger 30 sec no movement for {pair}")
              sell = True
              rsn = "NO MOVEMENT"
              return sell, rsn, max_ret, max_date

          # Secure profit
          elif (max_ret > 0) and (g < secure_ret) and (rsi < 80):
              print(f"{self._now()}:Trigger SECURE PROFIT {secure_ret}% for {pair}, ")
              sell = True
              rsn = "SECURE PROFIT"
              return sell, rsn, max_ret, max_date

          # Tomer: Lamborgini - Fast breakout
          # elif (enter_buy_type == 'LAMBO') and (g > 0.4):
          #     print(f"{_now()}:Fast break out Lamborgini {pair}")
          #     sell = True
          #     rsn = "LAMBORGINI"
          #
          #     return sell, rsn, max_ret, max_date

          else:
              # last_price = d.Close[-1]
              # last_ema = ema[-1]
              tm.sleep(interval)

      return sell, rsn

  def _get_final_list(self):
      for pair in self.market_prices.keys():
          if self._find_asset(self.market_prices[pair], pair):
              self.top_gainers.append(pair)


  def _run_algo(self):
      while True:
          engine_status = os.environ["algo_engine"]
          printf(f"\n{self._now()}: Engine status. : {engine_status}", {self._now()}, "NA", "NA","NA","NA","NA","NA","NA","NA","NA")
          if engine_status == 'stop':
              printf(f"\n{self._now()}: Stop Algo engine was was received. Exiting Algo. ", {self._now()}, "NA", "NA","NA","NA","NA","NA","NA","NA","NA")
              break
          self._cycle += 1
          printf(f"\n{self._now()}: Running algo cycle {self._cycle} : ",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")
          printf(f"{self._now()}: Wallet balance: ${self._wallet._get_base_coin_balance()}",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")
          printf(f"{self._now()}: Fetch market symbols. This may take couple of minutes...",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")
          self.get_symbols()
          printf(f"{self._now()}: Found {len(self.pairs)}  {self.pairs}",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")

          print(f"{self._now()}: Get market quotes...")
          self._get_market_data()

          print(f"{self._now()}: Get top gainers in the last minutes.")
          self._top_gainers_last_min()
          print(f"{self._now()}: Found {len(self.top_last_min_gain)} symbols : {self.top_last_min_gain}.")

          ################ Todo: remove test ########################
          self.top_last_min_gain = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'BCCUSDT', 'NEOUSDT', 'LTCUSDT']
          #########################################################################################

          # Processing top gainers
          if len(self.top_last_min_gain) > 0 :
              self.pairs = self.top_last_min_gain
              print(f"{self._now()}: Get quotes of candidates.")
              # examine the the top gainers
              self.min_dl = (datetime.utcnow() + relativedelta(minutes=-200)).strftime("%Y-%m-%d %H:%M:%S")
              self.max_dl = (datetime.utcnow() + relativedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
              self._get_market_data() # new market_price quotes dictionary
              print(f"{self._now()}: Filter candidates that returned above 0.3% in the last minute.")
              self._get_final_list() # find asset into top_gainers
              print(f"{self._now()}: Found {len(self.top_gainers)} symbols : {self.top_gainers}.")

              ################ Todo: remove test ########################
              self.top_gainers = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
              #########################################################################################

        ### Buy Order
              if len(self.top_gainers) > 0:
                  pair = random.choice(self.top_gainers)
                  print(f"{self._now()}: About to buy asset: {pair}")
                  stepSize = float(self.client.get_symbol_info(pair)['filters'][1]['stepSize'])
                  precision = int(round(-math.log(stepSize, 10), 0))
                  pair_price = float(self.client.get_symbol_ticker(symbol=pair)['price'])
                  base_coin_balance = self._wallet._get_base_coin_balance()
                  qty = round(base_coin_balance / pair_price, precision)

                  #initialize order object
                  buy_order = order(self.client,"BUY","Binance",pair,pair_price, qty, self._wallet)
                  # Send test buy to Binanace
                  print(f"{self._now()}: Send BUY test order of {pair} with quantity: {qty}")

                  # Test Binance transaction ---------------------------------------------------------------------
                  #order_passed, results = new_order._test_buy_order(pair, qty) #todo: activate when moving to live
                  #print(f"{self._now()}: Recieve results from Binance. Order_passed: {order_passed}. Results: {results}")
                  order_passed = True
                  # End Test -------------------------------------------------------------------------------------

                  # Update wallet
                  if order_passed:
                      try:
                            buy_order._buy_demo()
                            printf(f"{self._now()}: Send BUY test order of {pair} with quantity: {qty}", {self._now()},
                                   {pair_price}, "GROW", "BUY", {pair}, {qty}, {pair_price * qty}, "ALGO", 100, 0)
                      except BaseException as e:
                            print(f"{self._now()}: Order could not be fullfiled. \n Error: {e}")


        ### Sell Order
              print(f"{self._now()}: Monitor symbol: {pair}. Get last hour candles...")
              printf(f"{self._now()}: Monitor symbol: {pair}. Get last hour candles...",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")
              # Working on single symblol
              self.pairs = [pair]
              self.min_dl = (datetime.utcnow() + relativedelta(hours=-1)).strftime("%Y-%m-%d %H:%M:%S")
              self.max_dl = (datetime.utcnow() + relativedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
              self._get_market_data()
              print(f"{self._now()}: Monitor symbol: {pair}. Add indicators...")
              printf(f"{self._now()}: Monitor symbol: {pair}. Add indicators...",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")
              self.market_prices = _add_indicators(self.market_prices)

              # Get symbol buying quotes
              st_price = self._wallet._get_token_st_price(pair)
              t_qty = self._wallet._get_token_balance(pair)
              print( f"{self._now()} Crytpo: {pair}. Start Price: {round(st_price, 7)}.  Current Price: {round(self._get_pair_price(pair), 6)}. Current PNL: {round(self._get_pair_price(pair) / st_price * 100 - 100, 2)}% ")
              printf(
                  f"{self._now()} Crytpo: {pair}. Start Price: {round(st_price, 7)}.  Current Price: {round(self._get_pair_price(pair), 6)}. Current PNL: {round(self._get_pair_price(pair) / st_price * 100 - 100, 2)}% ",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")

              # Check Exit Position
              trigger_sell, sell_rsn, max_ret, max_date = self._check_exit(pair, self.market_prices[pair], st_price)

              if trigger_sell:
                  pair_price = self._get_pair_price(pair)
                  qty = float(t_qty)
                  stepSize = stepSize = float(self.client.get_symbol_info(pair)['filters'][1]['stepSize'])
                  precision = 1 / stepSize
                  qty = int(qty * precision) / precision
                  gain = round(pair_price / st_price * 100 - 100, 2)
                  print(f"{self._now()} Trying to execute SELL  {pair}, Quantity: {qty}")
                  printf(f"{self._now()} Trying to execute SELL  {pair}, Quantity: {qty}",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")

                  # SELL ORDER ....
                  #initialize order object
                  sell_order = order(self.client,"SELL","Binance",pair,pair_price, qty, self._wallet)
                  # Send test buy to Binanace
                  print(f"{self._now()}: Send SELL test order of {pair} with quantity: {qty}")
                  printf(f"{self._now()}: Send SELL test order of {pair} with quantity: {qty}",{self._now()}, {pair_price},"GROW","SELL",{pair},{qty},{pair_price*qty},"ALGO",100,0)
                  # Test Binance transaction ---------------------------------------------------------------------
                  # Todo: test live sell
                  order_passed = True
                  ##### ------------------------------------------------------------------------------------------
                  print(f"{self._now()}: SELL {pair}. Price: {pair_price}. Reason: {sell_rsn}. PNL: {gain}%. mode: **{self._mode}**")
                  printf( f"{self._now()}: SELL {pair}. Price: {pair_price}. Reason: {sell_rsn}. PNL: {gain}%. mode: **{self._mode}**",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")

                  # Update Wallet
                  if order_passed:
                      try:
                            sell_order._sell_demo()
                      except BaseException as e:
                            print(f"{self._now()}: Order could not be fullfiled. \n Error: {e}")

                  print(f"{self._now()}: Order cycle completed")
                  tm.sleep(3)