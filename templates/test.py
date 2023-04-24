import bs4 as bs
import requests
import yfinance as yf
import datetime

resp = requests.get('http://en.wikipedia.org/wiki/List_of_S%26P_500_companies')
soup = bs.BeautifulSoup(resp.text, 'lxml')
table = soup.find('table', {'class': 'wikitable sortable'})
tickers = {}
for row in table.findAll('tr')[1:]:
    tickers[row.findAll('td')[1].text] = row.findAll('td')[0].text.strip('\n')
    # tickers.append(ticker)

# tickers = [s.replace('\n', '') for s in tickers]

print(tickers)