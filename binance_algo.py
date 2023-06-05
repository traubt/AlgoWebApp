from datetime import *
from dateutil.relativedelta import *
import pandas as pd
from tqdm import tqdm
from wallet import wallet
from order import order
import math
# import talib
import time as t
import pandas_ta as ta
import random
from flask import session
import os
import requests
import json
import time as tm
from multiprocessing import Pool
import datetime as dt
import concurrent.futures
import crypto_list
import bs4 as bs
import yfinance as yf


from flask_socketio import emit


count_msg = 0
interval = '15m'
period = '5d'
USER = ""



class crypto_bot:
  def __init__(self, payload,socket):
    self.pairs = []
    self.count_msg_error = 0
    self.count_msg_processed = 0
    # self.client = client
    self.min_dl = (datetime.utcnow() + relativedelta(minutes=-5)).strftime("%Y-%m-%d %H:%M:%S")
    self.max_dl = (datetime.utcnow() + relativedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
    self.quote_df = pd.DataFrame() # holds downloaded quote
    self.market_prices = {}
    self.quotes = {}
    self.filter_top_traders = []
    self.top_last_min_gain = [] # list of top last min gainer (0.3%)
    self.top_gainers = [] # list of top gainers that pass find asset criteria
    self.found = False
    self._base_coin = 'USDT'
    self._mode = 'TEST'
    self._cycle = 0
    self._wait = False #wait for the client to comeback with api information
    # self.start_time = tm.time()
    #-- Payload
    self.user = payload["user_name"]
    USER = self.user # for emit send message to user
    self.market = payload["market"]
    self._default_amount = float(payload["walletInitBalance"])
    self._wallet = wallet(self._base_coin, self._default_amount)
    self._strategy = payload["strategy"]
    if self._strategy == 'DIY':
        # print(f"Strategy: {self._strategy}")
        self._interval = payload["interval"]
        self._time_scale = payload["interval"] + "m"
        self._indicators = payload["indicators"]
        self._buy_rule = payload["buyRule"]
        self._sell_rule = payload["sellRule"]
        self._stop_loss = float(payload["stopLoss"])
        self._no_movement = int(payload["sellNoMovement"])
        self._secure_profit = float(payload["secureProfit"])
    else: #"SYSTEM"
        # print(f"Strategy: {self._strategy}")
        self._time_scale = "5m"
        self._buy_rule = "(max_ratio > 1)" #  and (min_ratio < 1) and (max_avg_ratio < 1.04)"
        self._sell_rule = "(df.Close[-1] < df.Open[-2])"
        self._stop_loss = 2
        self._no_movement = 60
        self._secure_profit = 1

    # handle user socket messages
    @socket.on(self.user)
    def handle_message(msg):
        cnt_err = 0
        try:
            self.quote_df = pd.DataFrame()
            self.quote_df = pd.DataFrame(json.loads(msg["data"]), columns=['Date', 'Open', 'High', 'Low', 'Close', 'Volume',
                                                'close_time', 'qav', 'num_trades',
                                                'taker_base_vol', 'taker_quote_vol', 'ignore'
                                                ]).astype(float)
            self.quote_df['Date'] = pd.to_datetime(self.quote_df['Date'], unit='ms')
            self.quote_df.set_index('Date', inplace=True)
            self.quotes[msg["symbol"]] = self.quote_df
            self.market_prices = self.quotes
            self.count_msg_processed +=1
        except BaseException as e:
            self.count_msg_error +=1
        # print("Total handled",self.count_msg_processed + self.count_msg_error ," out of: " ,int(msg["count"]))
        if (self.count_msg_processed + self.count_msg_error == int(msg["count"])):
            self._wait = False
        else:
            self._wait = True



  def printf(self,msg, msg_date, msg_price, msg_grow, order_type, msg_symbol, msg_qty, msg_amt, msg_sellRsn, msg_timeLapse,msg_fee):
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
                 {'data': message, 'count': count_msg,
                  'date': msg_date,
                  'price': msg_price,
                  'grow': msg_grow,
                  'type': msg_type,
                  'symbol': msg_symbol,
                  'qty': msg_qty,
                  'amt': msg_amt,
                  'sell_rsn': msg_sellRsn,
                  'time_lapse': msg_timeLapse,
                  # 'fee':msg_fee}, namespace='/', broadcast=True)
                  'fee': msg_fee}, namespace='/', room=self.user)
        except BaseException as e:
            print(f"error: {e} \n when trying to send messages: {msg}")
        return None

    # print information to client
  def printi(self,msg, msg_date, msg_price, msg_grow, order_type, msg_symbol, msg_qty, msg_amt, msg_sellRsn, msg_timeLapse,msg_fee):
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
                 {'data': message, 'count': count_msg,
                  'date': msg_date,
                  'price': msg_price,
                  'grow': msg_grow,
                  'type': msg_type,
                  'symbol': msg_symbol,
                  'qty': msg_qty,
                  'amt': msg_amt,
                  'sell_rsn': msg_sellRsn,
                  'time_lapse': msg_timeLapse,
                  'fee': msg_fee}, namespace='/', room=self.user)
        except BaseException as e:
            print(f"error: {e} \n when trying to send messages: {msg}")
        return None

  def _now(self):
      return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

  def _get_broker(self):
      if self.market == 'crypto':
          broker = 'Binance'
      else:
          broker = 'Tradestation'
      return broker

  def get_symbol_ticker(self, token):
      try:
          url = "https://api.binance.com/api/v3/ticker/price"
          querystring = {"symbol": token}
          response = requests.request("GET", url, params=querystring)
      except BaseException as e:
          print(f" Could not get current price of {token} from binance")
      return (float(response.json()['price']))


  def get_symbols(self):
      if self.market == 'crypto':
          self.pairs = crypto_list.crypto_pairs
          #remove UP symbols
          self.pairs = sorted([i for i in self.pairs if 'UP' not in i])[:150]
          self.pairs = sorted([i for i in self.pairs if 'DOWN'
                                                        '' not in i])[:150]
      else:
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
          self.pairs = sorted(stockList)[0:100]

  def remove_non_active_tokens(self):
      try:
          #sync self.pairs with quotes
          self.pairs = sorted(list(self.market_prices.keys()))
          # Remove empty quotes
          for token in self.pairs:
                try:
                    if (self.market_prices[token].index[-1]) and (isinstance(self.market_prices[token].index[-1],pd.Timestamp)):
                      continue
                except BaseException as e:
                    print(f"Removing token {token} : {e}")
                    self.market_prices.pop(token)
                    self.pairs.remove(token)
                    continue
          # remove tickers which are not traded recently
          max_dateTime = max([self.market_prices[i].index[-1] for i in self.pairs if isinstance(self.market_prices[i].index[-1],pd.Timestamp)])
          for token in self.pairs:
              if self.market_prices[token].index[-1] != max_dateTime:
                  self.printf(f"{self._now()}: Removing token: {token}", {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA")
                  self.market_prices.pop(token)
                  self.pairs.remove(token)
      except BaseException as e:
          self.printf(f"{self._now()}: Error in remove not active tokens: {e}", {self._now()}, "NA", "NA", "NA", "NA", "NA","NA", "NA", "NA", "NA")
      return None
  def _add_indicators(self,quotes,pair):
      err = 0
      try:
          if self._strategy == "DIY":
              for ind in self._indicators.keys():
                  if ind == "MACD":
                    quotes[["MACD","HISTO","SIGNAL"]] = eval(self._indicators[ind]['tech'])
                  elif ind in [ "BOLLINGER_LOW","BOLLINGER_MID","BOLLINGER_UP" ]:
                      quotes[["BB_LOW", "BB_MID", "BB_UP", "BB_BW", "BB_PCT"]] = pd.DataFrame(quotes["Close"]).ta.bbands()
                  elif ind in [ "STOCH_K","STOCH_D" ]:
                      quotes[["STOCH_K", "STOCH_D"]] = pd.DataFrame(quotes["Close"]).ta.stoch()
                  else:
                    quotes[ind] = eval(self._indicators[ind]['tech'])
          else:
          # Update Stochastic MA default parameters
          # Calculate stochastic with the new parameters
          # stoc = btalib.stochastic(quotes[pair].High,quotes[pair].Low,quotes[pair].Close)
          # Add bolinger bands
          # bbands = btalib.bbands(quotes[pair]['Close'])
          # Join the indicator to the main df
          # quotes[pair] = quotes[pair].join([macd.df, bbands.df])
          # quotes[pair] = quotes[pair].join([macd.df])
          # Add EMW
          # quotes[pair]['EMA'] = btalib.ema(quotes[pair].Close, period=emawdw).df
          # quotes[pair]['EMA'] = quotes[pair]['Close'].ewm(span=7, adjust=False).mean()
          # quotes[pair]['P_EMA'] = quotes[pair]['EMA'].shift(1)
              quotes['MA10'] = quotes['Close'].rolling(10).mean()
          # quotes[pair]['MA5'] = quotes[pair]['Close'].rolling(5).mean()
          # quotes[pair]['EMA_ratio'] = quotes[pair]['EMA'] / quotes[pair]['mid']
          # quotes[pair]['Prev_EMA_ratio'] = quotes[pair]['EMA_ratio'].shift(1)
              quotes['RSI'] = pd.DataFrame(quotes['Close']).ta.rsi(length=14)
          #quotes[pair]['P_RSI'] = quotes[pair]['RSI'].shift(1)
          #quotes[pair]['CAPVOL'] = quotes[pair]['Volume'] * quotes[pair]['Close']
          # Add daily change
          # quotes[pair]['Change'] = quotes[pair].Close.pct_change()
          # quotes[pair]['min100'] = quotes[pair].Change.rolling(100).min()
          # quotes[pair]['min30'] = quotes[pair].Close.rolling(30).min()
          # ATR
          # quotes[pair]['ATR'] = btalib.atr(quotes[pair].High, quotes[pair].Low,
          #                                         quotes[pair].Close).df
          # quotes[pair]['max_ATR'] =
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
          print(f"{self._now()}: Add indicators error:{pair}, {e}")
          self.printf(f"{self._now()}: Add indicators error:{pair}, {e}", {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA")
          err += 1
          # continue
      # print(f"{self._now()} Number of errors add indicators: {err}")
      return quotes

#this is a test of github
  def downloadHistoryPrices(self, symbol,i, total):
      root_url = 'https://api.binance.com/api/v1/klines'
      url = root_url + '?symbol=' + symbol + '&interval=' + self._time_scale
      emit(self.user, {'data': url, 'symbol':symbol, 'index':i, 'total':total}, namespace='/',room=self.user)
      return None

  def downloadHistoryPricesNyse(self,stock):
      self.quote_df  =   yf.download(tickers=stock, interval=self._time_scale ,period = self.period, show_errors=False,progress=False)
      return None

  def _get_market_data(self):
      i = 0
      symbol_cnt = len(self.pairs)
      self.quotes = {}
      self.market_prices = {}
      start_time = tm.time()
      self.count_msg_processed = 0
      self.count_msg_error = 0
      #request client for api test one for now
      # self.pairs =['ALPACAUSDT','BTCUSDT']
      for pair in tqdm(self.pairs, disable=True):
          try:
              i = i + 1
              if self.market == 'crypto':
                  self.downloadHistoryPrices(pair,i,symbol_cnt )
              else:
                  self.downloadHistoryPricesNyse(pair)
              # avoid max api rate
              t.sleep(0.1)
          except BaseException as e:
              # print("Error download quotes :",e)
              continue
      return None

  def _get_pair_price(self,pair):
      if self.market == 'crypto':
            price = float(self.get_symbol_ticker(pair))
      else:
            price = float(yf.Ticker(pair).info['regularMarketPrice'])
      return price

  def _top_volume_trades(self,filter_trades):
      l = []
      m = []
      final_list = []
      top_volume = []
      top_traders = []
      #filter top volume
      try:
          for x in self.market_prices.keys():
              d = [0] * 2
              volume = float(self.market_prices[x]['Volume'][-100:].mean())
              d[0] = x
              d[1] = volume
              l.append(d)
          top_volume = [x[0] for x in sorted(l, key=lambda a: a[1], reverse=True)[:100]]
          #filter number of trades only applicable for binance
          if self.market == 'crypto':
              for t in top_volume:
                  r = [0] * 2
                  trades = float(self.market_prices[t]['num_trades'][-100:].mean())
                  r[0] = t
                  r[1] = trades
                  m.append(r)
              top_traders = [x[0] for x in sorted(m, key=lambda a: a[1], reverse=True)[:filter_trades]]
      except BaseException as e:
          print(f"Error find asset. Length of {x} {len(self.market_prices[x])} error: {e}")
          self.printf(f"{self._now()}: Error in top volume trades. Could not process symbol {x}. Error: {e}", {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA")
          pass


      if self.market == 'crypto' :
          final_list = top_traders
      else:
           final_list = top_volume

      return final_list

  def _top_gainers_last_min(self):
      l = []
      # self._time_scale = '1m'
      ## No need to download prices again as performance in websocket is good
      # self.period = '2d'
      # self._wait = True
      # self._get_market_data()
      # while self._wait:
      #     pass
      for x in self.market_prices.keys():
          try:
              d = [0] * 3
              gain = round(self.market_prices[x]['Close'][-1] / self.market_prices[x]['Open'][-2] * 100 - 100, 2)
              capvol = int(self.market_prices[x]['Volume'][-2] * self.market_prices[x]['Close'][-2])
              # Alont Change gayin to gain>0.3
              if gain > 0.1:  # and gain < 3:
                  d[0] = x
                  d[1] = gain
                  d[2] = capvol
                  l.append(d)
          except:
              continue
      # get top last min gainer who broke 0.3%
      self.top_last_min_gain = [x[0] for x in sorted(l, key=lambda a: a[1], reverse=True)]

  def _find_asset(self,df, token):
      found = False
      try:
          df = self._add_indicators(df, token)
          # The following paramenters applicable only for strategy "SYSTEM"
          price = df['Close'][-1]
          open = df.loc[:]['Open'][-2]
          history_max_price = df.loc[:].iloc[120:-2]['Close'].max()
          history_avg_price = df.loc[:].iloc[120:-2]['Close'].mean()
          max_ratio = price / history_max_price
          min_ratio = open / history_max_price
          max_avg_ratio = price / history_avg_price

          if eval(self._buy_rule):
            found = True

      except BaseException as e:
          print(f"Error find asset: {e}")
          self.printf(f"{self._now()}: Error in find asset module.{token} {e}", {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA")
          None
      return found

  def _download_1min_quotes(self,pair):
        try:
              quote = {}
              self.period = '2d'
              # self._time_scale = '1m'
              self.pairs = [pair]
              self._wait = True
              self._get_market_data()
              while self._wait:
                  pass
              quote[pair] = self.quote_df
              quote[pair] = self._add_indicators(quote[pair],pair)
        except BaseException as e:
            print(f" Could not download 1 min quote: {e}")
            self.printf(f"{self._now()}: Could not download 1 min quote. {e}", {self._now()}, "NA", "NA", "NA", "NA", "NA",
                   "NA", "NA", "NA", "NA")
        return quote[pair]

  def _check_exit(self,pair, enter_df, st_price):
      sell = False
      rsn = "IN"
      max_ret = 0
      max_date = self._now()
      secure_ret =  0
      # print(f"\n{self._now()} {pair} Check exit: check price action every second.")
      t_interval = 1 # sleep time every 1 sec
      count_sec = 0

      try:
          while not sell:
              txt = ""
              monitor_indicators = ""
              count_sec += 1
              df = self._download_1min_quotes(pair)
              price = df.Close[-1]
              stop_loss = round(enter_df.Close[-1] - enter_df.Close[-1] * self._stop_loss/100,6)
              g = df.Close[-1] / enter_df.Close[-1] * 100 - 100

              #prepare monitor text
              if self._strategy == "DIY":
                  for ind in self._indicators.keys():
                      monitor_indicators += " "+ind+ ":  "+ str(round(eval(self._indicators[ind]['eval']),6))
                  txt = "Token: " + pair + " Price: " + str(round(df.Close[-1], 2)) +  ", Current Return: " + str(round(g, 3)) + "%, Max Return: "\
                         + str( round(max_ret, 3)) + "%, Secure Return: " + str(secure_ret) + "%." + monitor_indicators
              # logging.info(txt)
              #     print(txt)
              self.printi(f"{self._now()}  Token: {pair}  Price:  {str(round(df.Close[-1], 8))} ,  Previous Open: {str(round(df.Open[-2],6))}, Stop-Loss:  {str(stop_loss)}, Profit: {str(round(g, 3))} %, Max Return:{str(round(max_ret,3))}, Secure Profit:{str(round(secure_ret,3))} ,{monitor_indicators}",
                     {self._now()},
                     {str(round(df.Close[-1], 10))},
                     {str(round(g, 3))},
                     "MONITOR",
                     pair,"NA","NA","NA","NA","NA")
              # save max return and date
              if (g > max_ret) :
                  max_ret = g
                  max_date = self._now()
              # Secure max return in stages
              if (g > self._secure_profit*16 and (self._secure_profit*16) > secure_ret):
                  secure_ret = self._secure_profit*16

              if (g > self._secure_profit*8 and (self._secure_profit*8) > secure_ret):
                  secure_ret = self._secure_profit*8

              if (g > self._secure_profit*4 and (self._secure_profit*4) > secure_ret):
                  secure_ret = self._secure_profit*4

              if (g > self._secure_profit*2 and (self._secure_profit*2) > secure_ret):
                  secure_ret = self._secure_profit*2

              if (g > self._secure_profit and self._secure_profit > secure_ret):
                  secure_ret = self._secure_profit


              ######### EXIT FROM POSITION #########
              # No movement
              # if algo_engine
              if os.environ["algo_engine"] == 'stop':
                  sell = True
                  rsn = "STOP_BOT"
                  return sell, rsn, max_ret, max_date

              elif (count_sec > self._no_movement) and (secure_ret == 0):
                  # print(f"{self._now()}:Trigger {self._no_movement} seconds no growth for {pair}")
                  sell = True
                  rsn = "No_Growth"
                  return sell, rsn, max_ret, max_date
              # Exit Secure return
              elif (secure_ret > 0 ) and (g < secure_ret):
                  # print(f"{self._now()}:Trigger sell  for {pair}. ")
                  self.printf(f"{self._now()}: Trigger sell Secure Return for {pair}", {self._now()}, "NA", "NA", "NA", "NA","NA", "NA", "NA", "NA", "NA")
                  sell = True
                  rsn = "Secure_Return"
                  return sell, rsn, max_ret, max_date
              # Exit Strategy Rule
              elif eval(self._sell_rule):
                  # print(f"{self._now()}:Trigger sell rule: {self._sell_rule} for {pair}. ")
                  self.printf(f"{self._now()}: Trigger sell rule: {self._sell_rule} for {pair}", {self._now()}, "NA", "NA", "NA", "NA","NA", "NA", "NA", "NA", "NA")
                  sell = True
                  rsn = "Exit_Strategy"
                  return sell, rsn, max_ret, max_date
              # Stop Loss
              elif price < stop_loss:
                  # print(f"{self._now()}:Trigger reach stop-loss {stop_loss}% for {pair} ")
                  self.printf(f"{self._now()}: Trigger reach stop-loss {stop_loss}% for {pair} ", {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA")
                  sell = True
                  rsn = "Stop_Loss"
                  return sell, rsn, max_ret, max_date
              ###################################################################################
              else:
                  t.sleep(t_interval)
      except BaseException as e:
          # print(f" Error monitoring token: {e}")
          self.printf(f"{self._now()}: Error in monitoring token. {e}", {self._now()}, "NA", "NA", "NA", "NA", "NA",
                 "NA", "NA", "NA", "NA")

      return sell, rsn

  def _get_entry_strategy_match(self):
      self.top_gainers = []
      for pair in self.market_prices.keys():
          if  (self._find_asset(self.market_prices[pair], pair)):
              self.top_gainers.append(pair)

  def _run_algo(self):
      #Engine:
      run = True
      while run:
          engine_status = os.environ["algo_engine"]
          self.printf(f"\n{self._now()}: Engine status. : {engine_status}", {self._now()}, "NA", "NA","NA","NA","NA","NA","NA","NA","NA")
          if engine_status == 'stop':
              self.printf(f"\n{self._now()}: Stop Algo engine was was received. Exiting Algo. ", {self._now()}, "NA", "NA","NA","NA","NA","NA","NA","NA","NA")
              run = False
              break
          self._cycle += 1
          self.printf(f"\n{self._now()}: Running algo cycle {self._cycle} : ",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")
          self.printf(f"{self._now()}: Wallet balance: ${self._wallet._get_base_coin_balance()}",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")
          # get list of symbols to work on
          self.printf(f"{self._now()}: Fetch market {self.market} symbols.", {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA")
          self.get_symbols()
          self.printf(f"{self._now()}: Found {len(self.pairs)} symbols.", {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA")
          # print(f"{self._now()}: Get {self.market} market quotes...")
          self.printf(f"{self._now()}: Download market quotes for all symbols. This may take couple of minutes.",
                 {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA")
          # self._time_scale = '15m'
          self.period = '2d'
          ### GET INFORMATION FROM CLIENT !!!!!!!!!!!!!!
          self._wait = True
          self._get_market_data()
          while self._wait:
              pass
          #################################################
          self.remove_non_active_tokens()
          # filter top volume/traders:
          self.filter_top_traders = self._top_volume_trades(50)
          #reset list of symbols
          self.pairs = self.filter_top_traders
          # engine_status = os.environ["algo_engine"]
          # self.printf(f"\n{self._now()}: Engine status. : {engine_status}", {self._now()}, "NA", "NA","NA","NA","NA","NA","NA","NA","NA")
          # if engine_status == 'stop':
          #     self.printf(f"\n{self._now()}: Stop Algo engine was was received. Exiting Algo. ", {self._now()}, "NA", "NA","NA","NA","NA","NA","NA","NA","NA")
          #     break
          # print(f"{self._now()}: Get top gainers in the last minutes.")
          self.printf(f"{self._now()}: Get top gainers in the last minutes", {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA","NA", "NA", "NA")
          self._top_gainers_last_min()
          # print(f"{self._now()}: Found {len(self.top_last_min_gain)} symbols : {self.top_last_min_gain}.")
          self.printf(f"{self._now()}: Found {len(self.top_last_min_gain)} symbols : {self.top_last_min_gain}.", {self._now()}, "NA", "NA", "NA", "NA", "NA","NA", "NA", "NA", "NA")
          # # Processing top gainers
          if len(self.top_last_min_gain) > 0 :
              self.pairs = self.top_last_min_gain
              # print(f"{self._now()}: Get quotes of candidates.")

 ############ Entry Strategy #################
              #examine the top gainers
              self.printf(f"{self._now()}: Get ENTRY STRATEGY matches.", {self._now()}, "NA", "NA", "NA", "NA", "NA","NA", "NA", "NA", "NA")
              # Stay on "scan market" for 2 seconds (else scan market is too quick)
              t.sleep(1)
              self.pair = self.top_last_min_gain
              # print(f"{self._now()}: Filter entry strategy.")
              self._get_entry_strategy_match() # find asset into top_gainers
              # print(f"{self._now()}: Found {len(self.top_gainers)} symbols : {self.top_gainers}.")
              self.printf(f"{self._now()}: Found {len(self.top_gainers)} symbols which match ENTRY STRATEGY.  Symbols : {self.top_gainers}. ", {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA","NA", "NA", "NA")
##########################################################

            ### Buy Order
              if len(self.top_gainers) > 0:
                  pair = random.choice(self.top_gainers)
                  # pair = random.choice(self.top_last_min_gain)
                  # print(f"{self._now()}: About to buy asset: {pair}")
                  self.printf(f"{self._now()}: About to buy asset: {pair}", {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA")
                      # stepSize = float(self.client.get_symbol_info(pair)['filters'][1]['stepSize'])
                      # precision = int(round(-math.log(stepSize, 10), 0))
                  precision = 10
                  pair_price = self._get_pair_price(pair)
                  base_coin_balance = self._wallet._get_base_coin_balance()
                  qty = round(base_coin_balance / pair_price, precision)

                  #initialize order object

                  buy_order = order("BUY",self._get_broker(),pair,pair_price, qty, self._wallet)
                  # Send test buy to Binanace
                  # print(f"{self._now()}: Send BUY test order of {pair} with quantity: {qty}")

                  # Test Binance transaction ---------------------------------------------------------------------
                  #order_passed, results = new_order._test_buy_order(pair, qty) #todo: activate when moving to live
                  #print(f"{self._now()}: Recieve results from Binance. Order_passed: {order_passed}. Results: {results}")
                  order_passed = True
                  # End Test -------------------------------------------------------------------------------------

                  # Update wallet
                  if order_passed:
                      try:
                            buy_order._buy_demo()
                            self.printf(f"{self._now()}: Send BUY test order of {pair} with quantity: {qty}", {self._now()},
                                   {pair_price}, "GROW", "BUY", {pair}, {qty}, {pair_price * qty}, "ALGO", 100, 0)
                      except BaseException as e:
                            print(f"{self._now()}: Order could not be fullfiled. \n Error: {e}")

              else:
                  self.printf(f"{self._now()}: Algo did not find entry strategy hit from symbol list. Continue scanning...", {self._now()}, "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA")
                  continue


        ### Sell Order
              # print(f"{self._now()}: Monitor symbol: {pair}. Get last hour candles...")
              self.printf(f"{self._now()}: Monitor symbol: {pair}. Get last hour candles...",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")
              # Working on single symblol
              self.pairs = [pair]
              self.period = '2d'
              # self._time_scale = '1m'
              self._wait = True
              self._get_market_data()
              while self._wait:
                  pass
              # print(f"{self._now()}: Monitor symbol: {pair}. Add indicators...")
              self.printf(f"{self._now()}: Monitor symbol: {pair}. Add indicators...",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")
              self.market_prices = self._add_indicators(self.market_prices[pair],pair)

              # Get symbol buying quotes
              st_price = self._wallet._get_token_st_price(pair)
              current_price = self._get_pair_price(pair)
              t_qty = self._wallet._get_token_balance(pair)
              # print( f"{self._now()} Symbol: {pair}. Start Price: {round(st_price, 7)}.  Current Price: {current_price}. Current PNL: {round(self._get_pair_price(pair) / st_price * 100 - 100, 2)}% ")
              self.printf(
                  f"{self._now()} Symbol: {pair}. Start Price: {round(st_price, 7)}.  Current Price: {current_price}. Current PNL: {round(self._get_pair_price(pair) / st_price * 100 - 100, 2)}% ",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")

              # Check Exit Position
              trigger_sell, sell_rsn, max_ret, max_date = self._check_exit(pair, self.market_prices, st_price)

              if trigger_sell:
                  pair_price = self._get_pair_price(pair)
                  qty = float(t_qty)
                  # stepSize = float(self.client.get_symbol_info(pair)['filters'][1]['stepSize'])
                  # precision = 1 / stepSize
                  # qty = int(qty * precision) / precision
                  gain = round(pair_price / st_price * 100 - 100, 2)
                  # print(f"{self._now()} Trying to execute SELL  {pair}, Quantity: {qty}")
                  self.printf(f"{self._now()} Trying to execute SELL  {pair}, Quantity: {qty}",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")

                  # SELL ORDER ....
                  #initialize order object
                  sell_order = order("SELL",self._get_broker(),pair,pair_price, qty, self._wallet)
                  # Send test buy to Binanace
                  # print(f"{self._now()}: Send SELL test order of {pair} with quantity: {qty}")
                  self.printf(f"{self._now()}: Send SELL test order of {pair} with quantity: {qty}",{self._now()}, {pair_price},"GROW","SELL",{pair},{qty},{pair_price*qty},"ALGO",100,0)
                  # Test Binance transaction ---------------------------------------------------------------------
                  # Todo: test live sell
                  order_passed = True
                  ##### ------------------------------------------------------------------------------------------
                  # print(f"{self._now()}: SELL {pair}. Price: {pair_price}. Reason: {sell_rsn}. PNL: {gain}%. mode: **{self._mode}**")
                  self.printf( f"{self._now()}: SELL {pair}. Price: {pair_price}. Reason: {sell_rsn}. PNL: {gain}%. mode: **{self._mode}**",{self._now()},"NA","NA","NA","NA","NA","NA","NA","NA","NA")

                  # Update Wallet
                  if order_passed:
                      try:
                            sell_order._sell_demo()
                      except BaseException as e:
                            print(f"{self._now()}: Order could not be fullfiled. \n Error: {e}")

                  # print(f"{self._now()}: Order cycle completed")
                  t.sleep(3)