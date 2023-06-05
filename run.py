from flaskblog import app
from flask_socketio import SocketIO
# socketio = SocketIO(app)

''' MOVE ROUTES TO RUN.PY ( remove from flaskblog import routes from __init__ '''

import os
import secrets
import logging

# from PIL import Image
from flask import  url_for, flash,  redirect, jsonify
from flaskblog import app, db, bcrypt
from flaskblog.forms import RegistrationForm, LoginForm, UpdateAccountForm
from flaskblog.models import User,UserAlgorun
from flask_login import login_user, current_user, logout_user, login_required
from flask import  render_template, session
from flask import request
import bs4 as bs
from datetime import datetime
import json
# import sqlite3
import pymysql
from ast import literal_eval
# websocket
from threading import Lock
from flask_socketio import SocketIO, emit
import requests
from binance import Client, ThreadedWebsocketManager, ThreadedDepthCacheManager
from binance.enums import *
from twilio.rest import Client as WA
import pandas as pd
import pandas_ta as ta
from wallet import wallet
from order import order
from binance_algo import crypto_bot as bot
from equity_algo_tbd import equity_bot as eq_bot
import yfinance as yf
###chatroom section
from flask_socketio import join_room, leave_room, send, SocketIO
import random
from string import ascii_uppercase
from pyngrok import ngrok

async_mode = None
global socketio
socketio = SocketIO(app, async_mode=async_mode)
thread = None
thread_lock = Lock()
rooms = {} #chat rooms
sid = "" #sid for joining chatrooms
user_concur =0


#chatroom



client = Client('PfBHXvzQ63qxsUmYdeUvlGZHOiiJrXdlhQ7kVsmaQUtjlyhzvkoMPswqnrwS6bok',
                'HG4CkUd5tm5wIQcXnDTJUnRnssjLhfZwoTW4LgESzRNjosQvuhqjtSlZSlmcy9uo')
account = client.get_account()
wallet = {}
now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
coin = 'USDT'
messages = []
_algo_status = 'stop'

conn = pymysql.connect(
    host='localhost',
    user='root',
    password="",
    db='algo_tt',
)

posts = [
    {
        'author': 'Admin',
        'title': 'Algo-Trading BOT',
        'content': 'Run the best strategies using our advanced AlgoTrading Bot.',
        'date_posted': datetime.utcnow().date()
    },
    {
        'author': 'Admin',
        'title': 'Portfolio Manager',
        'content': 'Manage and optimize your portfolio with stocks from markets around the world',
        'date_posted': datetime.utcnow().date()
    }
]

#####################  HELPERS FUNCTIONS ###########################

# url = 'https://api.coinbase.com/v2/prices/btc-usd/spot'



def _send_whatsapp_msg(c,k,p):
    # for i in wac.keys():
    status = "Not Success"
    try:
        # client = WA(k, p)
        # wac = {}
        # wac['Tomer'] = ['ACaa6d3a0629279c6f5aa185857a1fff99', 'bd80d0fb93f57aea98c600e4c5f86c32', '27741988890']
        # client = WA('ACaa6d3a0629279c6f5aa185857a1fff99', 'bd80d0fb93f57aea98c600e4c5f86c32')
        client = WA(k, p)
        # cell = wac['Tomer'][2]
        cell = c
        message = client.messages.create(
            from_='whatsapp:+14155238886',
            body=f"Hi there. Sending test message from AlgoTrading.",
            to=f'whatsapp:+{cell}'
        )
        if message:
           status = "Success"
    except BaseException as e:
        print(f"could not send WA message. Error: {e}")
    return status

#set user amount
# def _init_user_wallet_test(user,amount):
#     wallet[user] = []
#     token = {'asset': coin, 'free': '1000.00000000', 'locked': '0.00000000', 'st_price': 1000}
#     wallet[user].append(token)
#
#     return None

# def _transaction_order_test(ord_type, token, qty):
#     price = float(client.get_symbol_ticker(symbol=token + coin)['price'])
#     amt = round(qty * float(client.get_symbol_ticker(symbol=token + coin)['price']), 8)  # (include commission)
#     print(f"{now} {ord_type} {qty} {token} amount: {amt}")
#     if ord_type == 'BUY':
#         # Add new token quantity to user wallet
#         token = {'asset': token, 'free': str(qty), 'locked': '0.00000000', 'st_price': price}
#         wallet[user].append(token)
#         # Deduct amount from base coin
#         new_coin_balance = float(wallet[user][0]['free']) - amt
#         print(f"{now} {coin} balance before buy: {wallet[user][0]['free']} ")
#         wallet[user][0]['free'] = str(round(new_coin_balance, 8))
#         print(f"{now} {coin} balance after buy: {wallet[user][0]['free']} ")

    if ord_type == 'SELL':
        # Deduct qty token
        idx = [item['asset'] for item in wallet[user]].index(token)
        # Remove the token from the wallet
        del wallet[user][idx]
        # Add sell amount to base coin balance
        new_coin_balance = float(wallet[user][0]['free']) + amt
        print(f"{now} {coin} balance before sell: {wallet[user][0]['free']} ")
        wallet[user][0]['free'] = str(round(new_coin_balance, 8))
        print(f"{now} {coin} balance after sell: {wallet[user][0]['free']} ")

    return None

def get_historical_klines(symbol, interval='15m'):
    try:
        root_url = 'https://api.binance.com/api/v1/klines'
        url = root_url + '?symbol=' + symbol + '&interval=' + interval
        # data = json.loads(requests.get(url).text)
        data = requests.get(url)
        data = data.json()
        df = pd.DataFrame(data)
        df.columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume',
                                                                'close_time', 'qav', 'num_trades',
                                                                'taker_base_vol', 'taker_quote_vol', 'ignore']
        # for line in df:
        #     del line[6:]
        # Add indicators
        df['RSI'] = pd.DataFrame(df['Close'].astype(float)).ta.rsi(length=14)
        df['MA10'] = df['Close'].rolling(10).mean()
        df['SHARPE'] = df["Close"].astype(float).pct_change().rolling(50).mean()/df["Close"].astype(float).pct_change().rolling(50).std()*100
        df['Date'] = pd.to_datetime(df['Date'], unit='ms')
        df.fillna('', inplace=True)
        df.set_index('Date', inplace=True)
        # print("Symbol sharpe: ",df['SHARPE'][-1])
    except BaseException as e:
        print("Error downloading quotes",e)
    return df

##################### END HELPER FUNCTIONS ##########################

@app.route("/")
@app.route("/home")
def home():
    # return render_template('home.html', posts=posts, async_mode=socketio.async_mode)
    return render_template('index.html', posts=posts, async_mode=socketio.async_mode)

@app.route("/")
@app.route("/application")
def application():
    return render_template('home.html', posts=posts, async_mode=socketio.async_mode)
    # return render_template('index.html', posts=posts, async_mode=socketio.async_mode)


@app.route("/about")
def about():
    return render_template('about.html', title='About')


@app.route("/register", methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user = User(username=form.username.data, email=form.email.data, password=hashed_password)
        db.session.add(user)
        db.session.commit()
        conn = pymysql.connect(host='localhost', user='root', password="", db='algo_tt', )
        curr = conn.cursor()
        sql = f"INSERT INTO user_wallet (username) VALUES ('{form.username.data}');"
        curr.execute(sql)
        conn.commit()
        curr.close()
        conn.close()
        flash('Your account has been created! You are now able to log in', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', title='Register', form=form)


@app.route("/login", methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()

        if form.ip.data:
            user_info = json.loads(form.ip.data)
        if user and bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            # session["user"] = user.username
            print(f"User: {user.username} has just login.")
            #update database with login
            user.last_login_date = datetime.utcnow()
            user.plan = "SILVER"
            if user_info["ip"]:
                user.ip = user_info["ip"]
                user.city = user_info["city"]
                user.country = user_info["country"]
                user.country_code = user_info["country_code"]
                user.country_calling_code = user_info["country_calling_code"]
                user.loc = user_info["loc"]
                user.postal = user_info["postal"]
                user.region = user_info["region"]
                user.timezone = user_info["timezone"]
            # user.country_code = user_info["country_code"]
            db.session.commit()
            return redirect(next_page) if next_page else redirect(url_for('application'))
        else:
            flash('Login Unsuccessful. Please check email and password', 'danger')
    return render_template('login.html', title='Login', form=form)


@app.route("/logout")
def logout():
    logout_user()
    session.clear()
    return redirect(url_for('home'))


def save_picture(form_picture):
    random_hex = secrets.token_hex(8)
    _, f_ext = os.path.splitext(form_picture.filename)
    picture_fn = random_hex + f_ext
    picture_path = os.path.join(app.root_path, 'static/profile_pics', picture_fn)

    output_size = (125, 125)
    # i = Image.open(form_picture)
    # i.thumbnail(output_size)
    # i.save(picture_path)

    return picture_fn


@app.route("/account", methods=['GET', 'POST'])
@login_required
def account():
    form = UpdateAccountForm()
    if form.validate_on_submit():
        if form.picture.data:
            picture_file = save_picture(form.picture.data)
            current_user.image_file = picture_file
        current_user.username = form.username.data
        current_user.email = form.email.data
        db.session.commit()
        flash('Your account has been updated!', 'success')
        return redirect(url_for('account'))
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email
    image_file = url_for('static', filename='profile_pics/' + current_user.image_file)
    return render_template('account.html', title='Account',
                           image_file=image_file, form=form)

@app.route("/symbols")
def symbols():
    return render_template('TradingViewChart.html', title='AlgoTrading', ticker='BTCUSDT')


@app.route('/graph')
def graph():
    return render_template("HighChart.html")


@app.route('/pipe', methods=["GET", "POST"])
def pipe():
    payload = {}
    headers = {}
    url = "https://demo-live-data.highcharts.com/aapl-ohlcv.json"
    r = requests.get(url, headers=headers, data ={})
    r = r.json()
    # quote = pd.DataFrame()
    # quote = yf.download("AAPL")
    # ret_quote = quote.to_json()
    return {"res":r}
    # return ret_quote

@app.route('/portfolio_manager')
def portfolio_manager():
    return render_template("portfolio_manager.html",url=public_url)

@app.route('/algotrading')
def algotrading():
    user = current_user.username
    pairs =[]
    payload = {'data': 'message sent from server'}
    return render_template("algotrading.html", pairs=pairs, messages=messages, user=user ,url=public_url)



'''    ************            API SECTION       ****************            '''

''' Autocomplete '''
@app.route("/autocomp", methods=["GET"])
def autocomp():
    headers = {}
    # if request.method == "GET":
    query = request.args.get('q')
    url = f"https://query1.finance.yahoo.com/v1/finance/search?q={query}&lang=en-US&region=US&quotesCount=6&newsCount=2&listsCount=2&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query&newsQueryId=news_cie_vespa&enableCb=true&enableNavLinks=true&enableEnhancedTrivialQuery=true&enableResearchReports=true&enableCulturalAssets=true&enableLogoUrl=true&researchReportsCount=2"
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
    resp = requests.get(url, headers=headers)
    soup = bs.BeautifulSoup(resp.text, features="lxml")
    res = soup.find('p').getText()
    js = json.loads(res)
    return js['quotes']

''' QUOTES '''
@app.route("/currentQuote", methods=["GET"])
def currentQuote():
    headers = {}
    query = request.args.get('q')
    url = f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{query}?formatted=true&crumb=Hg26nI3dM6a&lang=en-GB&region=GB&modules=summaryProfile%2CfinancialData%2CrecommendationTrend%2CupgradeDowngradeHistory%2Cearnings%2Cprice%2CsummaryDetail%2CdefaultKeyStatistics%2CcalendarEvents&corsDomain=uk.finance.yahoo.com"
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
    resp = requests.get(url, headers=headers)
    soup = bs.BeautifulSoup(resp.text, features="lxml")
    res = soup.find('p').getText()
    js = json.loads(res)
    return js

@app.route("/rateExchange", methods=["GET"])
def rateExchange():
    headers = {}
    query = literal_eval(request.args.get('q'))[0]
    url = f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{query}=X?formatted=true&crumb=YjSIc..Lqi7&lang=en-GB&region=GB&modules=price%2CsummaryDetail&corsDomain=uk.finance.yahoo.com";
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
    resp = requests.get(url, headers=headers)
    soup = bs.BeautifulSoup(resp.text, features="lxml")
    res = soup.find('p').getText()
    js = json.loads(res)
    return json.dumps(js)


@app.route("/currencyQuote", methods=["GET"])
def currencyQuote():
    headers = {}
    quotes = {}
    query = literal_eval(request.args.get('q'))
    # call current quote for each item
    for item in  query:
        url = f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{item}?formatted=true&crumb=Hg26nI3dM6a&lang=en-GB&region=GB&modules=summaryProfile%2CfinancialData%2CrecommendationTrend%2CupgradeDowngradeHistory%2Cearnings%2Cprice%2CsummaryDetail%2CdefaultKeyStatistics%2CcalendarEvents&corsDomain=uk.finance.yahoo.com"
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        resp = requests.get(url, headers=headers)
        soup = bs.BeautifulSoup(resp.text, features="lxml")
        res = soup.find('p').getText()
        js = json.loads(res)
        quotes[item] = js
    return json.dumps(quotes)


@app.route("/multipleCurrentQuote", methods=["GET"])
def multipleCurrentQuote():
    headers = {}
    quotes = {}
    query = literal_eval(request.args.get('q'))
    # call current quote for each item
    for item in  query:
        url = f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{item}?formatted=true&crumb=Hg26nI3dM6a&lang=en-GB&region=GB&modules=summaryProfile%2CfinancialData%2CrecommendationTrend%2CupgradeDowngradeHistory%2Cearnings%2Cprice%2CsummaryDetail%2CdefaultKeyStatistics%2CcalendarEvents&corsDomain=uk.finance.yahoo.com"
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        resp = requests.get(url, headers=headers)
        soup = bs.BeautifulSoup(resp.text, features="lxml")
        res = soup.find('p').getText()
        js = json.loads(res)
        quotes[item] = js
    return json.dumps(quotes)

@app.route("/historyQuotes", methods=["GET"])
def historyQuotes():
    headers = {}
    # if request.method == "GET":
    query = request.args.get('q')
    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{query}?formatted=true&crumb=mdguwb4ja3S&lang=en-GB&region=GB&interval=1d&events=div%7Csplit&range=4y&corsDomain=uk.finance.yahoo.com"
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
    resp = requests.get(url, headers=headers)
    soup = bs.BeautifulSoup(resp.text, features="lxml")
    res = soup.find('p').getText()
    js = json.loads(res)
    return js

@app.route("/rxHistoryQuotes", methods=["GET"])
def rxHistoryQuotes():
    headers = {}
    # if request.method == "GET":
    query = literal_eval(request.args.get('q'))[0]
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{query}=X?range=4y&comparisons=undefined&includePrePost=false&interval=1d&corsDomain=uk.finance.yahoo.com&.tsrc=financ"
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
    resp = requests.get(url, headers=headers)
    soup = bs.BeautifulSoup(resp.text, features="lxml")
    res = soup.find('p').getText()
    js = json.loads(res)
    return json.dumps(js)

@app.route("/multipleHistoryQuotes", methods=["GET"])
def multipleHistoryQuotes():
    headers = {}
    quotes = {}
    query = literal_eval(request.args.get('q'))
    for item in query:
        url = f"https://query2.finance.yahoo.com/v8/finance/chart/{item}?formatted=true&crumb=mdguwb4ja3S&lang=en-GB&region=GB&interval=1d&events=div%7Csplit&range=4y&corsDomain=uk.finance.yahoo.com"
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        resp = requests.get(url, headers=headers)
        soup = bs.BeautifulSoup(resp.text, features="lxml")
        res = soup.find('p').getText()
        js = json.loads(res)
        quotes[item] = js
    return json.dumps(quotes)

@app.route("/multipleRxHistoryQuotes", methods=["GET"])
def multipleRxHistoryQuotes():
    headers = {}
    quotes = {}
    query = literal_eval(request.args.get('q'))
    for item in query:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{item}=X?range=4y&comparisons=undefined&includePrePost=false&interval=1d&corsDomain=uk.finance.yahoo.com&.tsrc=financ"
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        resp = requests.get(url, headers=headers)
        soup = bs.BeautifulSoup(resp.text, features="lxml")
        res = soup.find('p').getText()
        js = json.loads(res)
        quotes[item] = js
    return json.dumps(quotes)

@app.route('/calc_sharpe', methods=['POST'])
def calc_sharpe():
    data = request.json
    sharpe = round(float(pd.DataFrame([float(i[4]) for i in data[-51:]]).pct_change().mean())/
                   float(pd.DataFrame([float(i[4]) for i in data[-51:]]).pct_change().std())*100,2)
    # print("Benchmark sharpe:",sharpe)
    return str(sharpe)

@app.route('/calc_indicators', methods=['POST'])
def calc_indicators():
    o_indicators = {}
    data = request.json
    #convert to dataframe
    datadf = pd.DataFrame(data)
    indicators = request.args.get('indicators')
    for indicator in json.loads(indicators):
        if indicator == "SMA10":
            res  = pd.DataFrame([i['close'] for i in data]).rolling(10).mean()
            res.fillna('', inplace=True)
            datadf['ma10'] = list(res[0])
        elif indicator == "SMA100":
            res  = pd.DataFrame([i['close'] for i in data]).rolling(100).mean()
            res.fillna('', inplace=True)
            datadf['ma100'] = list(res[0])
        elif indicator == "SHARPE":
            res = pd.DataFrame([i['close'] for i in data]).pct_change().rolling(50).mean() / pd.DataFrame([i['close'] for i in data]).pct_change().rolling(50).std()
            res.fillna('', inplace=True)
            datadf['sharpe'] = list(res[0])
        elif indicator == "RSI":
            x = pd.DataFrame({'close':[float(i['close']) for i in data]})
            y = pd.DataFrame(x['close']).ta.rsi(length=14)
            y.fillna('', inplace=True)
            datadf['rsi'] = list(y)
    return jsonify(datadf.to_dict())

@app.route('/binancePairHistory')
def binancePairHistory():
    query = request.args.get('symbol')
    interval = request.args.get('interval')
    candlesticks = get_historical_klines(query, interval)
    candlestick = []
    processed_candlesticks = []
    # for data in candlesticks:
    for index, data in candlesticks.iterrows():
        candlestick = {
            "time": int(index.value/1000000000),
            "open": float(data[0]),
            "high": float(data[1]),
            "low": float(data[2]),
            "close": float(data[3]),
            "volume": float(data[4]),
            "rsi": data[11],
            "ma10": data[12],
            "sharpe": data[13]
        }
        processed_candlesticks.append(candlestick)
    return json.dumps(processed_candlesticks)

# @app.route('/binancePairHistorySec')
# def binancePairHistorySec():
#     query = request.args.get('symbol')
#     interval = request.args.get('interval')
#     candlesticks = get_historical_klines(query, interval)
#     candlestick = []
#     processed_candlesticks = []
#     # for data in candlesticks:
#     for index, data in candlesticks.iterrows():
#         candlestick = {
#             "time": int(index.value/1000000000),
#             "open": float(data[0]),
#             "high": float(data[1]),
#             "low": float(data[2]),
#             "close": float(data[3]),
#             "volume": float(data[4]),
#             "rsi": data[11],
#             "ma10": data[12],
#             "sharpe": data[13]
#         }
#         processed_candlesticks.append(candlestick)
#     return json.dumps(processed_candlesticks)

@app.route('/yfStockHistory')
def yfStockHistory():
    candlesticks = pd.DataFrame()
    query = request.args.get('symbol')
    interval = request.args.get('interval')
    period = request.args.get('period')
    print("yfinance:",interval,period)
    candlesticks = yf.download(tickers=query, interval=interval, period=period, show_errors=False)
    candlesticks['RSI'] = pd.DataFrame(candlesticks['Close']).ta.rsi(length=14)
    candlesticks['MA10'] = candlesticks['Close'].rolling(10).mean()
    # candlesticks['MA5'] = candlesticks['Close'].rolling(5).mean()
    candlesticks.fillna('',inplace=True)
    candlestick = []
    processed_candlesticks = []
    for index,row in candlesticks.iterrows():
        candlestick = {
            "time": int(index.value/1000000000),
            "open": row['Open'],
            "high": row['High'],
            "low": row['Low'],
            "close": row['Close'],
            "volume": row['Volume'],
            "rsi" : row['RSI'],
            "ma10": row['MA10']
        }
        processed_candlesticks.append(candlestick)
    return json.dumps(processed_candlesticks)


# @app.route('/yfStockHistorySec')
# def yfStockHistorySec():
#     candlesticks = pd.DataFrame()
#     query = request.args.get('symbol')
#     interval = request.args.get('interval')
#     period = request.args.get('period')
#     print("yfinance:",interval,period)
#     candlesticks = yf.download(tickers=query, interval=interval, period=period, show_errors=False)
#     candlesticks['RSI'] = pd.DataFrame(candlesticks['Close']).ta.rsi(length=14)
#     candlesticks['MA10'] = candlesticks['Close'].rolling(10).mean()
#     # candlesticks['MA5'] = candlesticks['Close'].rolling(5).mean()
#     candlesticks.fillna('',inplace=True)
#     candlestick = []
#     processed_candlesticks = []
#     for index,row in candlesticks.iterrows():
#         candlestick = {
#             "time": int(index.value/1000000000),
#             "open": row['Open'],
#             "high": row['High'],
#             "low": row['Low'],
#             "close": row['Close'],
#             "volume": row['Volume'],
#             "rsi" : row['RSI'],
#             "ma10": row['MA10']
#         }
#         processed_candlesticks.append(candlestick)
#     return json.dumps(processed_candlesticks)

@app.route('/test_twilio')
def test_twilio():
    headers = {}
    # if request.method == "GET":
    cellphone = request.args.get('c')
    key = request.args.get('k')
    password  = request.args.get('p')
    status = _send_whatsapp_msg(cellphone,key, password)
    return status

# @app.route('/binance_init')
# def binance_init():
#     client = Client('PfBHXvzQ63qxsUmYdeUvlGZHOiiJrXdlhQ7kVsmaQUtjlyhzvkoMPswqnrwS6bok',
#                     'HG4CkUd5tm5wIQcXnDTJUnRnssjLhfZwoTW4LgESzRNjosQvuhqjtSlZSlmcy9uo')
#     # Get list of pair
#     pairs = client.get_all_tickers()
#     headers = {}
#     # if request.method == "GET":
#     query = request.args.get('q')
#     candlesticks = get_historical_klines(query, "15m")
#     candlestick = []
#     processed_candlesticks = []
#     for data in candlesticks:
#         candlestick = {
#             "time": float(data[0])/1000 ,
#             "open": float(data[1]),
#             "high": float(data[2]),
#             "low": float(data[3]),
#             "close": float(data[4])
#         }
#         processed_candlesticks.append(candlestick)
#     return json.dumps(processed_candlesticks)
#

@app.route('/get_assets')
def get_assets():
    query = request.args.get('q')
    _assets = {}
    if query == 'crypto':
        pairs = client.get_all_tickers()
        #filter USDT
        pairs = [item['symbol'] for item in pairs if 'USDT' in item['symbol']]
        # #create key val
        for item in pairs:
            _assets[item] = item
    else:
        url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        html = requests.get(url).content
        soup = bs.BeautifulSoup(html, 'html.parser')
        table = soup.find('table', {'class': 'wikitable sortable'})
        df = pd.read_html(str(table))[0]
        for index, row in df.iterrows():
            _assets[row['Security']] = row['Symbol']
    return json.dumps(_assets)

@app.route('/crypto_bot', methods=['GET', 'POST'])
def crypto_bot():
    os.environ["algo_engine"] = 'Running'
    payload =  request.json
    today = datetime.utcnow().date()
    now = datetime.utcnow()
    formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')
    date_string = today.strftime('%Y-%m-%d')
    today = datetime.strptime(date_string, '%Y-%m-%d').date()

    #insert new record to user_algorun
    conn = pymysql.connect(host='localhost', user='root', password="", db='algo_tt', )
    user = current_user.username
    print(f'Starting bot for user {user}')
    cur = conn.cursor()
    sql = f"INSERT INTO user_algorun (username,strategy_name,start_bal,run_date,start_date) VALUES \
    ('{payload['user_name']}','{payload['ruleName']}', '{payload['walletInitBalance']}','{today}','{formatted_date}');"
    cur.execute(sql)
    conn.commit()
    cur.close()
    conn.close()

    # algo_run = UserAlgorun(username=payload["user_name"], strategy_name=payload["strategy"],start_bal = payload["walletInitBalance"] )
    # db.session.add(algo_run)
    # db.session.commit()
    #run the engine
    runalgo = bot(payload,socketio)
    runalgo._run_algo()
    return "OK"

@app.route('/stop_bot')
def stop_bot():
    os.environ["algo_engine"] = 'stop'
    return "OK"

@socketio.event
def my_event(message):
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': message['data'], 'count': session['receive_count']})

# Receive the test request from client and send back a test response
# @socketio.on('test_message')
# def handle_message(data):
#     print(data)
#     emit('flask_response', {'data': 'Receive acknowledge from flask'})

@socketio.event
def connect():
    global user_concur
    print("Socket establish connection...")
    user_concur +=1
    print(f"Current user count: {user_concur}")
    # global thread
    # with thread_lock:
    #     if thread is None:
    #         thread = socketio.start_background_task(background_thread)
    emit('my_response', {'data': 'Connected to the server', 'count': 0})



@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['room']
    session["room"] = room
    session["name"] = username
    join_room(room)
    if room == username:
        send({"name": username, "message": "has established private socket connection","room":username}, to=room)
        print(f"Creating private socket for: {room}")
    else:
        #if first joiner than create the room
        if room not in rooms:
            rooms[room] = {"members": 0, "messages": []}
        # send(username + ' has entered the room.', to=room)
        send({"name": username, "message": "has entered the room"}, to=room)
        rooms[room]["members"] += 1
        print(f"{username} joined room {room}")
    return "Success"

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['room']

    # send(username + ' has left the room.', to=room)
    if room == username:
        send({"name": username, "message": "User is logged out","room":username}, to=room)
    else:
        send({"name": username, "message": "has left the room"}, to=room)
        leave_room(room)
        rooms[room]["members"] -= 1
    print(f"{username} logged out: {room}")

@app.route("/chat_room", methods=["POST", "GET"])
def chat_room():
    # session.clear()
    session["name"] = request.args.get('name')
    session["room"] = request.args.get('room')
    print("I'm connected to chat room")
    room = session.get("room")
    name = session.get("name")

    # if not room or not name:
    #     return
    if room not in rooms: # first member in the roon -> create the room
        rooms[room] = {"members": 0, "messages": []}

    join_room(room,sid)
    send({"name": name, "message": "has entered the room"}, to=room)
    rooms[room]["members"] += 1
    print(f"{name} joined room {room}")
    return "Success"
@socketio.on("message")
def message(data):
    room = session.get("room")
    if room not in rooms:
        return
    # msgs = json.dumps(rooms[room]["messages"])
    content = {
        "name": session.get("name"),
        "message": data["data"],
        "room" : room,
        # "history_msgs": msgs,
    }
    send(content, to=room)
    rooms[room]["messages"].append(content)

    print(f"{session.get('name')} said: {data['data']}")

@socketio.on("disconnect")
def disconnect():
    global user_concur
    room = session.get("room")
    name = session.get("name")
    leave_room(room)

    if room in rooms:
        rooms[room]["members"] -= 1
        if rooms[room]["members"] <= 0:
            del rooms[room]

    send({"name": name, "message": "has left the room"}, to=room)
    print(f"{name} has left the room {room}")
    user_concur -= 1
    print(f"Current user count: {user_concur}")

#  End chat room socket

'''    ###########  DATABASE API ################'''


@app.route("/get_user_portfolio", methods=["GET"])
def get_user_portfolio():
    # conn = sqlite3.connect('c:\Sqlite3\DB\portfolio_manager')
    # conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur_user =  current_user.username
    cur.execute(f"SELECT user_name ,user_portfolio_ind ,portfolio_data from user_portfolio where (user_portfolio_ind = 1 and user_name = '{cur_user}' and portfolio_data != '') or (user_name = 'sample' and user_portfolio_ind = 3) order by user_portfolio_ind")
    rows = cur.fetchall()
    return json.loads(json.dumps( [ix for ix in rows] ))

@app.route("/update_user_portfolio", methods=["GET","POST"])
def update_user_portfolio():
    try:
        cur = conn.cursor()
        # parameters
        data = request.args.get('portfolioM')
        c_records = request.args.get('count_rows')
        action = request.args.get('action')
        cur_user = current_user.username
        p_type = request.args.get('portfolio_type')
        now = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

        # add symbol
        if int(c_records) == 1 and action == "add":
            # delete last record
            sql =  f"delete from user_portfolio where user_name = '{cur_user}' and user_portfolio_ind = {p_type};"
            count = cur.execute(sql)
            conn.commit()
            # Add new record
            sql = f"insert into user_portfolio (`user_name`, `user_portfolio_ind`, `portfolio_creation_date`,`portfolio_modify_date`,`portfolio_count_records`,`portfolio_data`,`portfolio_last_action`,`portfolio_misc`) "\
					"VALUES" \
					f"('{cur_user}',{p_type}, '{now}','{now}',{c_records}, '{data}', 'ADD', 'First symbol ADDED to portfolio'); "
            count = cur.execute(sql)
            conn.commit()
            print("Record inserted successfully into user_portfolio table ", cur.rowcount)
            cur.close()


        if int(c_records) > 1 and action == "add":
            sql = f"update user_portfolio set portfolio_data ='{data}' ,portfolio_count_records ={c_records}, portfolio_modify_date = '{now}', " \
                  f"portfolio_last_action = 'ADD', portfolio_misc = 'One symbol added successfully' " \
                  f"where  user_name = '{cur_user}' and user_portfolio_ind = {p_type};"
            count = cur.execute(sql)
            conn.commit()
            print("Record inserted successfully into user_portfolio table ", cur.rowcount)
            cur.close()

        # Delete last symbol
        if (int(c_records) == 0  and ( action == "delete")) or (action == "delete_all"):
            sql = f"update user_portfolio set portfolio_data = '', portfolio_modify_date = '{now}', portfolio_last_action = 'DELETE', portfolio_count_records = 0, portfolio_misc = 'Remaining symbols deleted. Portfolio is empty'"\
                  f"where  user_name = '{cur_user}' and user_portfolio_ind = {p_type};"
            count = cur.execute(sql)
            conn.commit()
            print("Record deleted successfully from user_portfolio table ", cur.rowcount)
            cur.close()

        # Delete portfolio
        # if action == 'delete_all':
        #     sql = f"delete from user_portfolio where user_name = '{cur_user}' and user_portfolio_ind = {p_type};"
        #     count = cur.execute(sql)
        #     conn.commit()
        #     print("Record deleted successfully from user_portfolio table ", cur.rowcount)
        #     cur.close()

        # Delete symbol if not last
        if int(c_records) >= 1  and action == "delete":
            sql = f"update user_portfolio set portfolio_data = '{data}' ,portfolio_count_records ={c_records}, portfolio_modify_date = '{now}' " \
                  f",portfolio_last_action = 'DELETE', portfolio_misc = 'Symbol deleted successfuly'"\
                  f"where  user_name = '{cur_user}' and user_portfolio_ind = {p_type};"
            count = cur.execute(sql)
            conn.commit()
            print("Record deleted successfully from user_portfolio table ", cur.rowcount)
            cur.close()

        if action == "select":
            if p_type == "3":
                sql = f"SELECT portfolio_data from user_portfolio where user_name = 'sample' and user_portfolio_ind = 3 ;"
            else:
                sql = f"select portfolio_data from user_portfolio where user_name = '{cur_user}' and user_portfolio_ind = {p_type};"
            cur.execute(sql)
            rows = cur.fetchall()
            return json.loads(json.dumps( rows ))
    except BaseException as e:
        print("Failed to insert data into  table", e)
    finally:
        if conn:
            conn.close()
            print("The DB connection is closed")

    return "Completed"


@app.route("/update_algorun_db", methods=["GET", "POST"])
def update_algorun_db():
    try:
        conn = pymysql.connect( host='localhost', user='root', password="",db='algo_tt',)
        user = current_user.username
        cur = conn.cursor()
        data = request.get_json()
        today = datetime.utcnow().date()
        now = datetime.utcnow()
        formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')
        date_string = today.strftime('%Y-%m-%d')
        today = datetime.strptime(date_string, '%Y-%m-%d').date()
        #
        sql = f"select max(id) from user_algorun where username = '{user}' and strategy_name = '{data['strategy']}' and run_date = '{today}';"
        count = cur.execute(sql)
        rows = cur.fetchall()
        id = list(rows[0])[0]
        # update record
        sql = f"update user_algorun set end_date = '{formatted_date}' , " \
                f"duration = {int(data['duration'])} ," \
                f"num_trx = {int(data['num_trx'])} ," \
                f"end_bal = {float(data['end_bal'])}," \
                f"profit = {float(data['profit'])} ,"\
                f"pos_trades = {int(data['pos_trades'])},"\
                f"neg_trades = {int(data['neg_trades'])},"\
                f"tot_fee = {float(data['tot_fee'])}," \
                f"transactions = '{data['transactions']}'," \
                f"summary = '{data['summary']}' "\
                f"where username = '{user}' and strategy_name = '{data['strategy']}' and run_date = '{today}' and id = {id};"
        cur.execute(sql)
        conn.commit()
        print("Update user_algorun successfully ", id)
        cur.close()
        conn.close()
    except BaseException as e:
        print("Failed to insert data into  table", e)
    # finally:
    #     if conn:
    #         conn.close()
    #         print("The DB connection is closed")
    return jsonify({'success': True})

@app.route("/update_cell_no", methods=["GET", "POST"])
def update_cell_no():
    try:
        conn = pymysql.connect( host='localhost', user='root', password="",db='algo_tt',)
        user = current_user.username
        cur = conn.cursor()
        data = request.args.get('cell_no')
        sql = f"update user set cell_no = {data} where username = '{user}' ;"
        cur.execute(sql)
        conn.commit()
        print("Update user table successfully with user's cell no")
        cur.close()
        conn.close()
    except BaseException as e:
        print("Failed to insert data into  table", e)
    finally:
        if conn:
            conn.close()
            print("The DB connection is closed")
    return jsonify({'success': True})

@app.route("/get_algo_plans", methods=["GET","POST"])
def get_algo_plans():
    plans = {}
    conn = pymysql.connect(host='localhost', user='root', password="", db='algo_tt', )
    cur = conn.cursor()
    cur.execute(f"select * from plans")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    for row in rows:
        plans[row[0]] = row
    return json.loads(json.dumps( plans ))

@app.route("/get_user_info", methods=["GET","POST"]) #todo: move this to get_query
def get_user_info():
    conn = pymysql.connect(host='localhost', user='root', password="", db='algo_tt', )
    user = current_user.username
    cur = conn.cursor()
    cur.execute(f"select username,email,plan,convert(last_login_date,CHAR),city from user where username = '{user}'")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return json.dumps( rows )

@app.route("/submit", methods=["GET","POST"])
def submit():
    try:
        inApp = request.form['in_app']
        name = request.form['name']
        email = request.form['email']
        subject = request.form['subject']
        message = request.form['message']
        if inApp == 'Y':
            user = request.form['user']
            city = request.form['city']
            country = request.form['country']
            loc = request.form['loc']
            ip = request.form['ip']
            region = request.form['region']
            sql = f"INSERT INTO email_requests (info_email_add,info_ip_add,info_city,info_country,info_region,info_loc,input_email_add,input_name,input_subject,input_message,in_app)" \
                  f"VAlUES ('{email}','{ip}','{city}','{country}','{region}','{loc}','{email}','{name}','{subject}','{message}','{inApp}');"
        else:
            sql = f"INSERT INTO email_requests (input_email_add,input_name,input_subject,input_message,in_app)" \
                  f"VAlUES ('{email}','{name}','{subject}','{message}','{inApp}');"
        cur = conn.cursor()
        count = cur.execute(sql)
        rows = cur.fetchall()
        cur.close()
        conn.close()
    except BaseException as e:
            print(f"could not execute query: {sql}. Error: {e}")
            return "Error"
    return "OK"
@app.route("/get_query", methods=["GET","POST"])
def get_query():
    try:
        today = datetime.utcnow().date()
        now = datetime.utcnow()
        formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')
        date_string = today.strftime('%Y-%m-%d')
        today = datetime.strptime(date_string, '%Y-%m-%d').date()
        query = request.args.get('query')
        user = request.args.get('user')
        amount = request.args.get('amount')
        match query:
            case "Total_Duration":
                sql = f"SELECT sum(duration) from user_algorun where username='{user}' and run_date = '{today}';"
            case "Total_Transactions":
                sql = f"SELECT sum(num_trx) from user_algorun where username='{user}' and run_date = '{today}';"
            case "Total_Runs":
                sql = f"SELECT count(1) from user_algorun where username='{user}' and run_date = '{today}';"
            case "User_Wallet":
                sql = f"SELECT * from user_wallet where username='{user}';"
            case "Update_Wallet":
                sql = f"UPDATE user_wallet SET curr_wallet_amount = {round(float(amount),2)} , last_wallet_date = '{formatted_date}', gain_pct = curr_wallet_amount/init_wallet_amount*100-100 where username='{user}';"
            case "Archive_Wallet":
                sql = f"INSERT INTO user_wallet_history SELECT * from user_wallet where username='{user}';"
            case "New_Wallet":
                sql = f"update user_wallet set wallet_ind = wallet_ind +1, init_wallet_amount = {amount}, init_wallet_date = '{formatted_date}', curr_wallet_amount = {amount}, last_wallet_date ='{formatted_date}',gain_pct=0 where username='{user}';"
            case "Indicators":
                sql = f"select * from indicators order by name;"
            case "leaders":
                sql = f"select a.username, a.init_wallet_amount, DATE_FORMAT(a.init_wallet_date, '%Y-%m-%d %H:%i'), a.curr_wallet_amount,DATE_FORMAT(a.last_wallet_date, '%Y-%m-%d %H:%i'), round(a.gain_pct,2)\
                 from (SELECT * FROM `user_wallet`  UNION  select * from user_wallet_history) a where a.gain_pct > 0 order by a.gain_pct desc;"
        conn = pymysql.connect(host='localhost', user='root', password="", db='algo_tt', )
        cur = conn.cursor()
        check_code = cur.execute(sql)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        if not rows[0][0]:
            ret = "0"
            return ret
        elif len(rows[0]) == 1:
            ret = str(rows[0][0])
            return ret
        elif len(rows[0]) > 1:
            return jsonify( rows )
        else:
            return "Error"
    except BaseException as e:
            print(f"could not execute query: {sql}. Error: {e}")
            return "Error"

'''   ---------------------------    END MOVE of routes_tbd.py --------------------------------------'''

if __name__ == '__main__':
    public_url = ngrok.connect(5000).public_url
    public_url = "http://127.0.0.1:5000"
    print(f" * ngrok tunnel \"{public_url}\" -> \"http://127.0.0.1:5000\"")


    log = logging.getLogger('werkzeug')
    log.setLevel(logging.WARNING)
    # #set server logs
    # # Set up a logger with the name 'my_logger'
    # logger = logging.getLogger('tomer:')
    # # Set the logging level
    # # logger.setLevel(logging.INFO)
    # # Create a stream handler to write log messages to the console
    # sh = logging.StreamHandler()
    # # Set the logging level for the stream handler
    # sh.setLevel(logging.INFO)
    # # Create a formatter to format log messages
    # formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    # # Add the formatter to the stream handler
    # sh.setFormatter(formatter)
    # # Add the stream handler to the logger
    # logger.addHandler(sh)
    # # Replace print statements with logger calls
    # # print('This is a message')

    socketio.run(app,host="0.0.0.0",allow_unsafe_werkzeug=True,debug=True, use_reloader=False)