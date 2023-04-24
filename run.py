from flaskblog import app
from flask_socketio import SocketIO
# socketio = SocketIO(app)

''' MOVE ROUTES TO RUN.PY ( remove from flaskblog import routes from __init__ '''

import os
import secrets

# from PIL import Image
from flask import  url_for, flash, redirect, flash, redirect, jsonify
from flaskblog import app, db, bcrypt
from flaskblog.forms import RegistrationForm, LoginForm, UpdateAccountForm
from flaskblog.models import User
from flask_login import login_user, current_user, logout_user, login_required
from flask import  render_template, session
from flask import request
import bs4 as bs
from datetime import datetime
import json
import sqlite3
from ast import literal_eval
# websocket
from threading import Lock
from flask_socketio import SocketIO, emit
import requests
from binance import Client, ThreadedWebsocketManager, ThreadedDepthCacheManager
from binance.enums import *
from twilio.rest import Client as WA
import pandas as pd
from wallet import wallet
from order import order
from binance_algo import crypto_bot as bot
from equity_algo import equity_bot as eq_bot
import yfinance as yf
import datetime as dt



async_mode = None
global socketio
socketio = SocketIO(app, async_mode=async_mode)
thread = None
thread_lock = Lock()


client = Client('PfBHXvzQ63qxsUmYdeUvlGZHOiiJrXdlhQ7kVsmaQUtjlyhzvkoMPswqnrwS6bok',
                'HG4CkUd5tm5wIQcXnDTJUnRnssjLhfZwoTW4LgESzRNjosQvuhqjtSlZSlmcy9uo')
account = client.get_account()
wallet = {}
user = 'Tomer'
now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
coin = 'USDT'
messages = []
_algo_status = 'stop'

posts = [
    {
        'author': 'Corey Schafer',
        'title': 'Blog Post 1',
        'content': 'First post content',
        'date_posted': 'April 20, 2018'
    },
    {
        'author': 'Jane Doe',
        'title': 'Blog Post 2',
        'content': 'Second post content',
        'date_posted': 'April 21, 2018'
    }
]

#####################  HELPERS FUNCTIONS ###########################

url = 'https://api.coinbase.com/v2/prices/btc-usd/spot'


# global_message = ""

def background_thread():
    """Example of how to send server generated events to clients."""

    # count = 0
    # while True:
    #     socketio.sleep(3)
    #     count += 1
    #     price = ((requests.get(url)).json())['data']['amount']
    #     socketio.emit('my_response',
    #                   {'data': 'Bitcoin current price (USD): ' + price, 'count': count})
    pass



def _send_whatsapp_msg(c,k,p):
    # for i in wac.keys():
    status = "Not Success"
    try:
        # client = WA(k, p)
        wac = {}
        wac['Tomer'] = ['ACaa6d3a0629279c6f5aa185857a1fff99', 'bd80d0fb93f57aea98c600e4c5f86c32', '27741988890']
        client = WA('ACaa6d3a0629279c6f5aa185857a1fff99', 'bd80d0fb93f57aea98c600e4c5f86c32')
        cell = wac[user][2]
        # cell = "27741988890"
        message = client.messages.create(
            from_='whatsapp:+14155238886',
            body=f"Hi there. Sending message from AlgoTrading.",
            to=f'whatsapp:+{cell}'
        )
        if message:
           status = "success"
    except BaseException as e:
        print(f"could not send WA message. Error: {e}")
    return status

#set user amount
def _init_user_wallet_test(user,amount):
    wallet[user] = []
    token = {'asset': coin, 'free': '1000.00000000', 'locked': '0.00000000', 'st_price': 1000}
    wallet[user].append(token)

    return None

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
                                                                'taker_base_vol', 'taker_quote_vol', 'ignore'                                                  ]
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
    return render_template('home.html', posts=posts, async_mode=socketio.async_mode)

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
        if user and bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('home'))
        else:
            flash('Login Unsuccessful. Please check email and password', 'danger')
    return render_template('login.html', title='Login', form=form)


@app.route("/logout")
def logout():
    logout_user()
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
    return render_template("portfolio_manager.html")

@app.route('/algotrading')
def algotrading():
    # binance
    client = Client('PfBHXvzQ63qxsUmYdeUvlGZHOiiJrXdlhQ7kVsmaQUtjlyhzvkoMPswqnrwS6bok',
                    'HG4CkUd5tm5wIQcXnDTJUnRnssjLhfZwoTW4LgESzRNjosQvuhqjtSlZSlmcy9uo')
    account = client.get_account()

    pairs = client.get_all_tickers()
    #filter USDT
    pairs = [item['symbol'] for item in pairs if 'USDT' in item['symbol']]
    payload = {'data': 'message sent from server'}
    return render_template("algotrading.html", pairs=pairs, messages=messages)



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
            "open": float(row['Open']),
            "high": row['High'],
            "low": row['Low'],
            "close": row['Close'],
            "volume": row['Volume'],
            "rsi" : row['RSI'],
            "ma10": row['MA10']
        }
        processed_candlesticks.append(candlestick)
    return json.dumps(processed_candlesticks)

@app.route('/test_twilio')
def test_twilio():
    headers = {}
    # if request.method == "GET":
    cellphone = request.args.get('c')
    key = request.args.get('k')
    password  = request.args.get('p')
    status = _send_whatsapp_msg(cellphone,password, password)
    return status

@app.route('/binance_init')
def binance_init():
    client = Client('PfBHXvzQ63qxsUmYdeUvlGZHOiiJrXdlhQ7kVsmaQUtjlyhzvkoMPswqnrwS6bok',
                    'HG4CkUd5tm5wIQcXnDTJUnRnssjLhfZwoTW4LgESzRNjosQvuhqjtSlZSlmcy9uo')
    # Get list of pair
    pairs = client.get_all_tickers()
    headers = {}
    # if request.method == "GET":
    query = request.args.get('q')
    candlesticks = get_historical_klines(query, "15m")
    candlestick = []
    processed_candlesticks = []
    for data in candlesticks:
        candlestick = {
            "time": float(data[0])/1000 ,
            "open": float(data[1]),
            "high": float(data[2]),
            "low": float(data[3]),
            "close": float(data[4])
        }
        processed_candlesticks.append(candlestick)
    return json.dumps(processed_candlesticks)


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

@app.route('/crypto_bot')
def crypto_bot():
    os.environ["algo_engine"] = 'Running'
    chart_time_frame = request.args.get('timeFrame')
    wallet_balance = request.args.get('balance')
    market = request.args.get('market')
    runalgo = bot(market,chart_time_frame,wallet_balance)
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
@socketio.on('test_message')
def handle_message(data):
    print('received message: ' + str(data))
    emit('test_response', {'data': 'Test response sent'})

# Broadcast a message to all clients

@socketio.event
def connect():
    print("Socket establish connection...")
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(background_thread)
    emit('my_response', {'data': 'Connected to the server', 'count': 0})

@socketio.on('broadcast_response')
def handle_broadcast(data):
    print('received: ' + str(data))
    emit('my_response', {'data': 'Connected to the server', 'count': 9999})

'''    ###########  DATABASE API ################'''


@app.route("/get_user_portfolio", methods=["GET"])
def get_user_portfolio():
    session["user"] = "traubt"
    conn = sqlite3.connect('c:\Sqlite3\DB\portfolio_manager')
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur_user =  session["user"]
    cur.execute(f"SELECT user_name ,user_portfolio_ind ,portfolio_data from user_portfolio where (user_portfolio_ind = 1 and user_name = '{cur_user}' and portfolio_data != '') or (user_name = 'sample' and user_portfolio_ind = 3) order by user_portfolio_ind")
    rows = cur.fetchall()
    return json.loads(json.dumps( [dict(ix) for ix in rows] ))

@app.route("/update_user_portfolio", methods=["GET","POST"])
def update_user_portfolio():
    try:
        conn = sqlite3.connect('c:\Sqlite3\DB\portfolio_manager')
        cur = conn.cursor()
        # parameters
        data = request.args.get('portfolioM')
        c_records = request.args.get('count_rows')
        action = request.args.get('action')
        cur_user = session["user"]
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

    except sqlite3.Error as error:
        print("Failed to insert data into sqlite table", error)
    finally:
        if conn:
            conn.close()
            print("The SQLite connection is closed")


    return "Completed"


'''   ---------------------------    END MOVE of routes.py --------------------------------------'''

if __name__ == '__main__':
    # app.run(debug=True, use_reloader=False)
    socketio.run(app,allow_unsafe_werkzeug=True,debug=True, use_reloader=False)