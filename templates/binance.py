# import mplfinance as mpf
import gc
import time as t
# from multiprocessing import Pool
import pandas as pd
from datetime import datetime
from tqdm import tqdm
from datetime import *; from dateutil.relativedelta import *
# import btalib #trading indicators
# from multiprocessing import Pool
import warnings
warnings.filterwarnings("ignore")
#Data visualisation
# import plotly.graph_objs as go
import numpy as np
from binance import Client, ThreadedWebsocketManager, ThreadedDepthCacheManager
from binance.helpers import round_step_size
import os
from twilio.rest import Client as WA
import math


# Helper functions -----------------------------------------------

def _get_account_info():
    return client.get_account()


def _get_pair_info(pair):
    return client.get_symbol_info(pair)


def _get_account_balance():
    return client.get_account()['balances']


def _get_tickSize(pair):
    return float(_get_pair_info(pair)['filters'][2]['stepSize'])


def _get_coin_balance(coin):
    return [dictionary for dictionary in _get_account_balance() if dictionary["asset"] == coin]


def _get_coin_free(coin):
    return round(float(_get_coin_balance(coin)[0]['free']), 8)


def _get_server_time():
    ts = client.get_server_time()['serverTime']
    ts /= 1000
    return datetime.utcfromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')


def _get_pair_price(pair):
    return float(client.get_symbol_ticker(symbol=pair)['price'])


# def _get_pair_balance():
#   return round(base_balance + (coin_balance * pair_price),2)

def _get_active_coins():
    return [item['asset'] for item in _get_account_balance() if (float(item["free"]) > 0) | (float(item["locked"]) > 0)]


def _get_active_coins_secondary():
    return [item['asset'] for item in _get_account_balance() if
            (item["asset"] != 'BUSD') and ((float(item["free"]) > 0 or float(item["locked"]) > 0))]


def _get_detail_wallet():
    actv = []
    for i in _get_active_coins():
        pair = i + 'BUSD'
        try:
            pair_val = round(
                float(_get_coin_balance(i)[0]['free']) * float(client.get_symbol_ticker(symbol=pair)['price'])
                + float(_get_coin_balance(i)[0]['locked']) * float(client.get_symbol_ticker(symbol=pair)['price']), 6)

            actv.append([pair, pair_val])
        except:
            continue
    return actv


def _get_coins_to_sell():
    cl = []
    # TRSH = 10
    for i in [item['asset'] for item in _get_account_balance() if (float(item["free"]) > 0)]:
        try:
            coin_val = float(_get_coin_USD_balance(i))
            if (coin_val > 5) & (i != 'BUSD'):
                cl.append(i)
        except:
            continue
    return cl


# Coined purchased with amount > trshold
def _get_number_of_wallet_coins():
    return len([item for item in _get_detail_wallet() if item[0] != 'BUSDUSDT'])


def _get_wallet_balance():
    return sum([x[1] for x in _get_detail_wallet()])


def _get_coin_USD_balance(coin):
    return round(
        float(_get_coin_balance(coin)[0]['free']) * float(client.get_symbol_ticker(symbol=coin + 'USDT')['price']), 6)


def _get_max_num_coins_to_purchase():
    MAX_POS = 5
    return MAX_POS - _get_number_of_wallet_coins()


def _get_max_amount_to_invest_in_asset(coin):
    if _get_max_num_coins_to_purchase() != 0:
        amt = round(_get_coin_USD_balance(coin) / _get_max_num_coins_to_purchase(), 2)
    else:
        amt = 0
    return amt


def _get_wallet_usd_balance():
    amt = _get_coin_USD_balance('BUSD')
    for i in _get_active_coins_secondary():
        pair = i + 'BUSD'
        amt += _get_pair_price('BUSDUSDT') * _get_pair_price(pair) * (
                    float(_get_coin_balance(i)[0]['free']) + float(_get_coin_balance(i)[0]['locked']))
    return amt


def _get_filter_value(pair, filter):
    i = [item['filterType'] for item in _get_pair_info(pair)['filters']].index(filter)
    return _get_pair_info(pair)['filters'][i]


def _send_whatsapp_msg(msg):
    # for i in wac.keys():
    client = WA(wac[user][0], wac[user][1])
    cell = wac[user][2]
    try:
        message = client.messages.create(
            from_='whatsapp:+14155238886',
            body=f"{msg}",
            to=f'whatsapp:+{cell}'
        )
    except BaseException as e:
        print(f"{now} could not send WA message. Error: {e}")


def _download_3min_quotes(pair):
    time_scale = '3m'
    min_dl = (datetime.utcnow() + relativedelta(hours=-1)).strftime("%Y-%m-%d %H:%M:%S")
    max_dl = (datetime.utcnow() + relativedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
    df = downloadHistoryPrices(pair, time_scale, min_dl, max_dl)

    return df


def _get_timediff_in_hours(t):
    # t = math.floor(client.get_all_orders(symbol='GMTBUSD', limit=1)[0]['time']/1000)
    td = datetime.utcnow() - datetime.fromtimestamp(t)
    hours = td.seconds / 3600

    return hours


def _take_commission(qty, gain):
    com = 0.1
    # try:
    #   # name parameter will be set to the asset value by the client if not passed
    #   result = client.withdraw(
    #       coin='BUSD',
    #       address='BUSD136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23',
    #       amount = round(qty*com,6),
    #       addressTag='459008265')
    # except BinanceAPIException as e:
    #   print(f"{now} Fail to withdraw commission:", e)
    # else:
    print(
        f"{now} Profit Commission: ${round(qty * gain * com * float(client.get_symbol_ticker(symbol=coin + 'USDT')['price']), 4)}")

    return None


def _download_single_quote(pair, time_scale):
    quote = {}
    # pair = 'COTIBUSD'
    # time_scale = '4h'
    min_dl = (datetime.utcnow() + relativedelta(days=-60)).strftime("%Y-%m-%d %H:%M:%S")
    max_dl = (datetime.utcnow() + relativedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
    h = downloadHistoryPrices(pair, time_scale, min_dl, max_dl)
    quote[pair] = h
    quote = _add_indicators()

    return quote[pair]

# --------------------  END helper functions ------------------------------------------------

from sys import exec_prefix


def downloadHistoryPrices(pair, time_scale, min_dl, max_dl):
    pair_prices = client.get_historical_klines(pair, time_scale, min_dl, max_dl)
    # del unwanted data
    for line in pair_prices:
        del line[6:]
    # Convert to dataframe
    btc_df = pd.DataFrame(pair_prices, columns=['Date', 'Open', 'High', 'Low', 'Close', 'Volume']).astype(float)
    btc_df['Date'] = pd.to_datetime(btc_df['Date'], unit='ms')
    btc_df.set_index('Date', inplace=True)
    return btc_df


def _add_indicators(quotes):
    err = 0
    for pair in quotes.keys():
        try:
            macd = btalib.macd(quotes[pair].Close, pfast=12, pslow=26, psignal=9)
            # Update Stochastic MA default parameters
            # sma_low = btalib.sma(quotes[pair].low, period=3)
            # sma_high = btalib.sma(quotes[pair].high, period=1)
            # Calculate stochastic with the new parameters
            # stoc = btalib.stochastic(quotes[pair].High,quotes[pair].Low,quotes[pair].Close)
            # Add bolinger bands
            bbands = btalib.bbands(quotes[pair]['Close'])
            # Join the indicator to the main df
            quotes[pair] = quotes[pair].join([macd.df, bbands.df])
            # Add EMW
            # quotes[pair]['EMA'] = btalib.ema(quotes[pair].Close, period=emawdw).df
            quotes[pair]['EMA'] = quotes[pair]['Close'].ewm(span=90, adjust=False).mean()
            # quotes[pair]['EMA_ratio'] = quotes[pair]['EMA'] / quotes[pair]['mid']
            # quotes[pair]['Prev_EMA_ratio'] = quotes[pair]['EMA_ratio'].shift(1)
            quotes[pair]['S_RSI'] = btalib.stochrsi(quotes[pair].Close).df
            # Add daily change
            # quotes[pair]['Change'] = quotes[pair].Close.pct_change()
            # quotes[pair]['min100'] = quotes[pair].Change.rolling(100).min()
            # quotes[pair]['min30'] = quotes[pair].Close.rolling(30).min()
            # ATR
            quotes[pair]['ATR'] = btalib.atr(quotes[pair].High, quotes[pair].Low,
                                                    quotes[pair].Close).df
            quotes[pair]['max_ATR'] = quotes[pair]['ATR'].rolling(100).max()
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
            # print(pair," could not be obtained.", e)
            err += 1
            continue
    print(f"{now}, number of errors add indicators: {err}")
    return quotes


def _get_market_data(pairs):

    x = []
    stockList = []
    quotes = {}
    history = pd.DataFrame()

    # Get list of pairs
    # pairs = client.get_all_tickers()

    # Get list of coin pairs
    for x in pairs:
        if (x[-len(coin):] == coin) & ("DOWN" not in x) & ("UP" not in x):
            stockList.append(x)

    # print(f"{now} Available coins: {len(stockList)}{stockList}\nDownload quotes...")
    # Get quotes
    for pair in stockList:
        # Download history
        try:
            history = downloadHistoryPrices(pair, time_scale, min_dl, max_dl)
            quotes[pair] = history
        except:
            continue
    print(f"{now} Adding indicators...")
    quotes = _add_indicators(quotes)

    return quotes


def _test_buy_order(pair, qty):
    try:
        passed = True
        buy_order = client.create_test_order(symbol=pair, side='BUY', type='MARKET', quantity=qty)
        res = buy_order
    except BaseException as e:
        passed = False
        res = e
    return passed, res


def _test_sell_order(pair, qty):
    try:
        test = True
        sell_order = client.create_test_order(symbol=pair, side='SELL', type='MARKET', quantity=qty)
    except:
        test = False

    return test


def _find_asset(df):
    found = False
    try:

        # price
        top = df.loc[:]['top'][-1]
        ma20 = df.loc[:]['mid'][-1]
        ema = df.loc[:]['EMA'][-1]
        prev_close = df.loc[:]['Close'][-2]
        price = df.loc[:]['Close'][-1]
        history_max_price = df.loc[:].iloc[-150:-1]['Close'].max()
        max_ratio = price / history_max_price
        candle_range = df.loc[:]['High'][-1] / df.loc[:]['Low'][-1]
        # volume
        volume = df.loc[:]['Volume'][-1]
        hist_volume_avg = df.loc[:].iloc[-22:-1]['Volume'].mean()
        volume_ratio = volume / hist_volume_avg
        # macd
        macd_hist = df['histogram'][-1]
        macd = df['macd'][-1]
        # s_rsi
        stoc_rsi = df['S_RSI'][-1]

        # filter

        if (max_ratio < 1.10) and (volume_ratio > 0.7) and (macd_hist > 0) and (macd > 0) and (stoc_rsi > 0.999) and (
                price > prev_close) and (ma20 > ema) and (price > ma20):  # and (candle_range < 1.15) :
            found = True
    except:
        None
    return found


def _secondary_filter(pair):
    # check 5m price action
    d = pd.DataFrame()
    lastX = 100
    time_scale = '5m'
    min_dl = (datetime.utcnow() + relativedelta(days=-1)).strftime("%Y-%m-%d %H:%M:%S")
    max_dl = (datetime.utcnow() + relativedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
    d = downloadHistoryPrices(pair, time_scale, min_dl, max_dl)
    macd = btalib.macd(d.Close, pfast=12, pslow=26, psignal=9)
    d = d.join([macd.df])
    d['S_RSI'] = btalib.stochrsi(d.Close).df
    # last histogram < 0
    dz = d.loc[d['histogram'] < 0].index[-1]
    lastX = len(d) - d.index.get_loc(dz)
    #VOLUME
    volume = d['Volume'][-1]
    # volume_max_price = market_prices[ticker].loc[:end_date].iloc[-22:-1]['Volume'].max()
    hist_volume_avg = d.iloc[-30:-1]['Volume'].mean()
    volume_ratio = volume / hist_volume_avg

    found = False

    # if (d.histogram[-1] > d.histogram[-2]) and (d.macd[-1] > 0) and (d.histogram[-1] > 0) and (
    #         d.Close[-1] > d.iloc[-3:-1].Close.max()) and (d.S_RSI[-1] > 0.999) and (lastX < 10):
    if (d.histogram[-1] > 0) and (d.S_RSI[-1] > 0.999) and (lastX < 10) and (volume_ratio > 1):

        found = True
    else:
        print(f"{now} {pair} did not pass secondary filter. Move to the next candidate")

    return found


def _check_exit(pair, df, st_price):
    sell = False
    rsn = "IN"
    d = pd.DataFrame()

    # 1. if grow > 3% - secure return
    # if (df.Close[-1]/st_price) > 1.05:
    if (df.iloc[-1:].High.max() / st_price) > 1.03:
        print(f"{now} {pair} passed 3%. Check price action.")
        d = _download_3min_quotes(pair)
        print(f"{now} Current price: {d.Close[-1]} . Previous Close 3 min price: {d.Close[-2]}")
        if d.Close[-1] < d.Close[-2]:
            print(f"{now}:Trigger Exit TAKE PROFIT for {pair}")
            sell = True
            rsn = "Secure Profit"

    # 2. Reverse .
    # if (df.Close[-1] <= df.iloc[-2:-1].Low.min()) :
    # 5/4/2022
    # if (df.Close[-1] <= df.iloc[-4:-1].Open.min()):
    if (df.S_RSI[-1] < 0.8):
        print(f"{now}:Trigger Exit STOCH_RSI < 0.8")
        # print(f"{now} Current price: {df.Close[-1]} . Previous min 3 Open : {df.iloc[-4:-1].Open.min()}")
        sell = True
        rsn = "Bearish trend"

    # 3. "Dead passanger" older than 4 hours
    t = math.floor(client.get_all_orders(symbol=pair, limit=1)[0]['time'] / 1000)
    age = _get_timediff_in_hours(t)
    if age > 4:
        sell = True
        rsn = "Older than 4 hours"

    return sell, rsn


########################################   M A I N ############################################################
import time as t

cycle = 0
if __name__ == "__main__":
    while True:

        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        btc_df = pd.DataFrame()
        pair_prices = pd.DataFrame()
        h = pd.DataFrame()
        # d = pd.DataFrame()
        df = pd.DataFrame()
        pairs = []
        coin = 'BUSD'
        rounding = 6
        rollwdw = 45
        emawdw = 45
        base_coin = 'BUSDUSDT'
        positions = 5
        min_trs = 20
        mode = 'TEST'
        sell_prices = {}
        market_prices = {}
        # stockList = []
        sell_rsn = ""

        # Whatsapp
        wac = {}
        wac['Tomer'] = ['ACaa6d3a0629279c6f5aa185857a1fff99', 'bd80d0fb93f57aea98c600e4c5f86c32', '27741988890']
        # wac['Alon'] = ['AC60a51c5bda03cf03220645b9285b063b','46145c2268c172ba6148f097482a134a','972524549080']
        # wac['Tzahi'] = ['AC914211349b6a879f1ddb7a0644b608a7', 'bf9ddc92b197a0c3be0d9b0bc9fe7d46', '27814886195']

        # Binance Api Connection
        bin_api = {}
        bin_api['Tomer'] = ['PfBHXvzQ63qxsUmYdeUvlGZHOiiJrXdlhQ7kVsmaQUtjlyhzvkoMPswqnrwS6bok', 'HG4CkUd5tm5wIQcXnDTJUnRnssjLhfZwoTW4LgESzRNjosQvuhqjtSlZSlmcy9uo']
        # bin_api['Alon'] = ['Z7jqHiyCwllLADLmfRghdQr550wjvAiNIJ6w2egZlvm6dp2HQwgOAw7JELIuPEe4','lNSXvhCZ6GdR9jqVHFXUUnWPeHQv4xz4bpAEfIG25pAkA8IdYsP7iHbg2MY5tbdx']
        # bin_api['Tzahi'] = ['xAl7to3mivvN5PzmE76N1oPPKVsP8TLmxBCgwotMyddxWphDwxpukQnzjzBgiysT','D8khwov2NhhGSUSSEK04L3PoxqoEa9wCwSnt1PX4octwanoQjrkkRRnzodX80Ifh']
        cycle += 1
        time_scale = '4h'
        min_dl = (datetime.utcnow() + relativedelta(days=-50)).strftime("%Y-%m-%d %H:%M:%S")
        max_dl = (datetime.utcnow() + relativedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
        print(f"\n--------\n{now} Cycle: {cycle}")
        print(f"{now} Download quotes between {min_dl} and {max_dl}, time scale: {time_scale}")

        # Prepare quotes for all coin pairs
        client = Client(bin_api['Tomer'][0], bin_api['Tomer'][1])
        pairs = client.get_all_tickers()
        pairs = [x['symbol'] for x in pairs]
        market_prices = _get_market_data(pairs)

        for user in bin_api.keys():
            t.sleep(10)
            # Send message to verify program is running
            # if cycle == 1:
            #     wa_id = _send_whatsapp_msg(f"Algo Trading program has started...")
            if not cycle % 28:
                wa_id = _send_whatsapp_msg(f"Algo Trading program is running...")

                # Connect to binance client
            print(f"\n{now} Connecting to user: {user}")
            if user != 'Tomer':  # Already connected
                client = Client(bin_api[user][0], bin_api[user][1])

            try:
                x = _get_account_info()
            except:
                print(f"\n{now} Can't connect to user: {user}")
                continue

            # Get base coin quantity
            base_coin_qty = float(_get_coin_balance(coin)[0]['free'])
            # Get base currency balance
            free_balance = _get_coin_USD_balance(coin)
            # Get number of positions to invest in
            crpt_in_market = [item + coin for item in _get_coins_to_sell()]
            n_pos_to_buy = positions - len(crpt_in_market)
            print(f"{now} Coin invested: {crpt_in_market}")
            print(f"{now} Balance {coin} to spend: ${free_balance}")
            print(f"{now} Minimum amount to buy coin: ${min_trs}")

            # B U Y   O R D E R
            # ------------------

            if n_pos_to_buy == 0:
                print(f"{now} Portfolio is full. Check Sell Order...")

            if free_balance < min_trs:
                print(f"{now} Not enough balance in to buy a coin. ")

            elif n_pos_to_buy != 0 and free_balance > min_trs:
                print(f"{now} Buy ORDER:")

                # Amount to spent on each position
                POS_AMT = math.floor(free_balance * 0.97 / n_pos_to_buy)  # 0.97 : leave 3% free balance in base coin
                # free base coin qty to spend on each position
                QTY_AMT = round(base_coin_qty * 0.97 / n_pos_to_buy, 6)

                print(f"{now} Account Balance: ${round(_get_wallet_usd_balance(), 2)}")
                print(f"{now} ${free_balance} to spend. Power Buy - {n_pos_to_buy} positions at ${POS_AMT} each.")

                # Buying algorithm
                # 1. Find candidates per filter algorithm
                candidates = []
                for pair in market_prices.keys():
                    # print("Check buy filter...")
                    if (_find_asset(market_prices[pair])) and (pair not in crpt_in_market):
                        candidates.append(pair)

                # 2. Execute "Buy Order"
                print(f"{now} Found {len(candidates)} candidates: {candidates}")
                n_buys = min(n_pos_to_buy, len(candidates))
                print(f"{now} {n_buys} positions to buy")
                # perform n_buys transactions

                filled = 0

                for _ in range(n_buys):
                    try:
                        l = True
                        while l:

                            pair = candidates.pop()
                            stepSize = _get_tickSize(pair)
                            precision = int(round(-math.log(stepSize, 10), 0))
                            pair_price = float(client.get_symbol_ticker(symbol=pair)['price'])
                            qty = round(QTY_AMT / pair_price, precision)

                            order_passed, results = _test_buy_order(pair, qty)

                            if (order_passed) and (_secondary_filter(pair)):
                                # try:
                                if mode == 'TEST':
                                    print(f"{now} Execute TEST BUY ORDER for {pair}. Quantity: {qty}")
                                    wa_id = _send_whatsapp_msg(
                                        f"Trigger {mode} BUY ORDER for {pair}. Acc Bal: ${round(_get_wallet_usd_balance(), 2)} ")
                                    filled += 1
                                    print(f"{now} Filled:{filled}")
                                else:  # LIVE !!!!!!!!!!!!
                                    buy_order = client.create_order(symbol=pair, side='BUY', type='MARKET',
                                                                    quantity=qty)
                                    q = float(buy_order['executedQty'])
                                    p = float(buy_order['fills'][0]['price'])
                                    print(f"{now} Execute {mode} BUY ORDER for {pair}. BUY qty:{q} at price: {p}")
                                    wa_id = _send_whatsapp_msg(
                                        f"Trigger {mode} BUY ORDER for {pair}. Qty:{q} at price: {p}. Acc Bal: ${round(_get_wallet_usd_balance(), 2)} ")
                                    filled += 1
                                    print(f"{now} Filled:{filled}")
                            else:
                                print(f"{now} Execute ({mode}) BUY ORDER order for {pair} failed !")

                            ## Check if no more positions
                            if (len(candidates) == 0) or (filled == n_pos_to_buy):
                                raise Exception("No more positions to buy")
                                l = False
                    except BaseException as e:
                        print(f"{now} End buy exception was raised:", e)
                        break

            #  S E L L   O R D E R
            # ---------------------

            if len(crpt_in_market) > 0:
                print(f"{now} Sell ORDER:")
                print(f"{now} Check Sell condition for: {crpt_in_market}")
                time_scale = '5m'
                min_dl = (datetime.utcnow() + relativedelta(hours=-10)).strftime("%Y-%m-%d %H:%M:%S")
                max_dl = (datetime.utcnow() + relativedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
                print(f"{now} Download quotes between {min_dl} and {max_dl}, time scale: {time_scale}")
                print(
                    f"{now} Account balance : ${round(_get_wallet_usd_balance(), 2)}, cryptos in market: {crpt_in_market}")

                # Get historical quotes
                # for pair in crpt_in_market:
                #     h = downloadHistoryPrices(pair, time_scale, min_dl, max_dl)
                #     sell_prices[pair] = h
                # sell_prices = _add_indicators()
                sell_prices = _get_market_data(crpt_in_market)

                # Selling algorithm
                for pair in sell_prices.keys():

                    asset = pair[0:-len(coin)]
                    st_price = float(client.get_all_orders(symbol=pair, limit=1)[0]['cummulativeQuoteQty']) / float(
                        client.get_all_orders(symbol=pair, limit=1)[0]['executedQty'])
                    print(
                        f"{now} Crytpo: {pair}. Start Price: {round(st_price, 7)}.  Current Price: {round(_get_pair_price(pair), 6)}. Current PNL: {round(_get_pair_price(pair) / st_price * 100 - 100, 2)}% ")

                    trigger_sell, sell_rsn = _check_exit(pair, sell_prices[pair], st_price)

                    if trigger_sell:
                        sl_price = _get_pair_price(pair)
                        qty = _get_coin_free(asset)
                        stepSize = _get_tickSize(pair)
                        precision = 1 / stepSize
                        qty = int(qty * precision) / precision
                        print(f"{now}:Trying to execute SELL ORDER for {asset}, Quantity: {qty}")
                        # SELL ORDER ....
                        if _test_sell_order(pair, qty):
                            gain = round(sl_price / st_price * 100 - 100, 2)
                            if mode == 'TEST':
                                print(f"{now}:Trigger SELL ORDER for {pair}. Reason: {sell_rsn}. PNL: {gain}%")
                                wa_id = _send_whatsapp_msg(
                                    f"Trigger SELL ORDER for {pair}. PNL: {gain}%. Acc Bal: ${round(_get_wallet_usd_balance(), 2)}")
                            else:  # LIVE !!!!!!!!!!!!
                                print(f"{now} Exceuting SELL ORDER of {pair}, quantity: {qty}")
                                sell_order = client.create_order(symbol=pair, side='SELL', type='MARKET', quantity=qty)
                                q = float(sell_order['executedQty'])
                                p = float(sell_order['fills'][0]['price'])
                                b = float(sell_order['cummulativeQuoteQty'])
                                print(
                                    f"{now}:Trigger {mode} SELL ORDER for {pair}. Reason: {sell_rsn}. Price: {sl_price}. PNL: {gain}%")
                                wa_id = _send_whatsapp_msg(
                                    f"Trigger {mode} SELL ORDER for {pair}. Price: {sl_price}. PNL: {gain}%. Acc Bal: ${round(_get_wallet_usd_balance(), 2)}")
                                # if user != 'Tomer':
                                raw_gain = sl_price / st_price
                                if raw_gain > 0:
                                    _take_commission(b, raw_gain)
                        else:
                            print(f"{now} SELL order {pair} failed !!! ")
                            wa_id = _send_whatsapp_msg(f"Trigger{mode} SELL ORDER for {pair} failed !!! ")
            else:
                print(f"{now} Sell Order: Nothing to sell... ")

        print(f"{now} Recycle objects...")
        del sell_prices
        del market_prices
        del bin_api
        del pairs
        del wac
        del x
        del pair_prices
        del df
        del h
        del btc_df
        del client
        gc.collect()

        print(f"{now} Sleep 60sec...")
        t.sleep(60)