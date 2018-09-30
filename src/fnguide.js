const puppeteer = require('puppeteer');
const axios = require('axios');

String.prototype.format = function () {
  let formatted = this;
  for (let i = 0; i < arguments.length; i++) {
    const regexp = new RegExp(`\\{${i}\\}`, 'gi');
    formatted = formatted.replace(regexp, arguments[i]);
  }
  return formatted;
};

const URL = {
  LOGIN_PAGE: 'https://www.fnguide.com/home/login',
  DATE_PAGE: 'http://www.fnguide.com/fgdd/StkIndmByTime#multivalue=CJA005930|CII.001&adjyn=Y&multiname=삼성전자|종합주가지수',
  MKTCAP_PAGE: 'http://www.fnguide.com/fgdd/StkItemDateCap#tab=D&market=0',
  API: {
    date: 'http://www.fnguide.com/api/Fgdd/StkIndMByTimeGrdData?IN_MULTI_VALUE=CJA005930%2CCII.001&IN_START_DT=20000101&IN_END_DT={0}&IN_DATE_TYPE=D&IN_ADJ_YN=Y',
    kospi_tickers: 'http://www.fnguide.com/api/Fgdd/StkIndByTimeGrdDataDate?IN_SEARCH_DT={0}&IN_SEARCH_TYPE=J&IN_KOS_VALUE=1',
    kosdaq_tickers: 'http://www.fnguide.com/api/Fgdd/StkIndByTimeGrdDataDate?IN_SEARCH_DT={0}&IN_SEARCH_TYPE=J&IN_KOS_VALUE=2',
    index: 'http://www.fnguide.com/api/Fgdd/StkIndByTimeGrdDataDate?IN_SEARCH_DT={0}&IN_SEARCH_TYPE=I&IN_KOS_VALUE=0',
    etf: 'http://www.fnguide.com/api/Fgdd/StkEtfGrdDataDate?IN_TRD_DT={0}&IN_MKT_GB=0',
    ohlcv: 'http://www.fnguide.com/api/Fgdd/StkIndByTimeGrdDataDate?IN_SEARCH_DT={0}&IN_SEARCH_TYPE=J&IN_KOS_VALUE=0',
    mkt_cap: 'http://fnguide.com/api/Fgdd/StkItemDateCapGrdDataDate?IN_MKT_TYPE=0&IN_SEARCH_DT={0}',
    buysell: 'http://www.fnguide.com/api/Fgdd/StkJInvTrdTrendGrdDataDate?IN_MKT_TYPE=0&IN_TRD_DT={0}&IN_UNIT_GB=2',
    factor: 'http://www.fnguide.com/api/Fgdd/StkDateShareIndxGrdDataDate?IN_SEARCH_DT={0}&IN_MKT_TYPE=0&IN_CONSOLIDATED=1',
  },
};


class Puppet {

  constructor(taskName) {
    this.taskName = taskName;

    // Fnguide 유저 정보 속성으로 지정
    this.id = 'keystone2016';
    this.pw = 'keystone2016';

    // 퍼페티어 크롬 브라우저를 실행시킬때 브라우저의 사이즈 설정에 필요한 속성
    this.width = 1920;
    this.height = 1080;

    this.todayDate = new Date().toISOString().slice(0, 10).replace(/-/gi, '');
  }

  async startBrowser(headlessBool, slowMoTime = 100) {
    // 클래스 객체를 사용하기 쉽도록 속성을 함수의 로컬 변수로 만든다
    const width = this.width;
    const height = this.height;

    // 브라우저 옵션 설정
    if (headlessBool == true) {
      var puppeteerConfig = {
        headless: headlessBool,
        args: ['--no-sandbox'],
        slowMo: slowMoTime,
      };
    } else if (headlessBool == false) {
      var puppeteerConfig = {
        headless: headlessBool,
        args: ['--no-sandbox'],
        slowMo: slowMoTime,
        args: ['--window-size=${width}, ${height}'],
      };
    }
    this.browser = await puppeteer.launch(puppeteerConfig);
    this.page = await this.browser.newPage();

    await this.page.setViewport({ width, height });
    return true;
  }

  async login() {
    // 로그인 페이지로 가서 로그인한다
    const page = this.page;

    const IDInputSelector = '#txtID';
    const PWInputSelector = '#txtPW';
    const loginBtnSelector = '#container > div > div > div.log--wrap > div.log--area > form > div > fieldset > button';
    const logoutOtherIPUserBtnSelector = '#divLogin > div.lay--popFooter > form > button.btn--back';
    const FnguideLogoSelector = 'body > div.header > div > h1 > a';

    await page.goto(URL.LOGIN_PAGE);
    await page.waitForSelector(IDInputSelector);
    await page.click(IDInputSelector);
    await page.type(IDInputSelector, this.id);
    await page.click(PWInputSelector);
    await page.type(PWInputSelector, this.pw);
    await page.click(loginBtnSelector);

    const logoutOtherIPUserBtnExists = await page.$eval(
      logoutOtherIPUserBtnSelector,
      el => (!!el),
    ).catch((error) => { console.log(error); });
    if (logoutOtherIPUserBtnExists) {
      await page.click(logoutOtherIPUserBtnSelector);
    }

    // waitForSelector 메소드에 문제가 있어서, 강제로 5초를 쉬게 하고 waitForSelector를 실행시킨다
    await page.waitFor(5000)
      .then(() => {
        page.waitForSelector(FnguideLogoSelector).then().catch();
      });
  }

  async massDateCrawl() {
    const page = this.page;

    // set headers to fool Fnguide
    await page.setExtraHTTPHeaders({
      Referer: 'http://www.fnguide.com/fgdd/StkIndmByTime',
      'X-Requested-With': 'XMLHttpRequest',
    });
    const dateURL = URL.API.date.format(this.todayDate);
    await page.goto(dateURL);
    const dateData = await page.evaluate(() => {
      const data = JSON.parse(document.querySelector('body').innerText);
      return data;
    });

    return dateData;
  }

  async getKospiTickers(date) {
    const page = this.page;

    // set headers to fool Fnguide
    await page.setExtraHTTPHeaders({
      Referer: 'http://www.fnguide.com/fgdd/StkIndByTime',
      'X-Requested-With': 'XMLHttpRequest',
    });
    const kospiTickersURL = URL.API.kospi_tickers.format(date);
    await page.goto(kospiTickersURL);
    const kospiTickersData = await page.evaluate(() => {
      const data = JSON.parse(document.querySelector('body').innerText);
      return data
    });

    return kospiTickersData;
  }

  async getKosdaqTickers(date) {
    const page = this.page;

    // set headers to fool Fnguide
    await page.setExtraHTTPHeaders({
      Referer: 'http://www.fnguide.com/fgdd/StkIndByTime',
      'X-Requested-With': 'XMLHttpRequest',
    });
    const kosdaqTickersURL = URL.API.kosdaq_tickers.format(date);
    await page.goto(kosdaqTickersURL);
    const kosdaqTickersData = await page.evaluate(() => {
      const data = JSON.parse(document.querySelector('body').innerText);
      return data
    });

    return kosdaqTickersData;
  }

  async massIndexCrawl(date) {
    const page = this.page;

    // set headers to fool Fnguide
    await page.setExtraHTTPHeaders({
      Referer: 'http://www.fnguide.com/fgdd/StkIndByTime',
      'X-Requested-With': 'XMLHttpRequest',
    });

    // let indexURL = URL.API.index.format(this.todayDate)
    const indexURL = URL.API.index.format(date);
    await page.goto(indexURL);
    const indexData = await page.evaluate(() => {
      const data = JSON.parse(document.querySelector('body').innerText);
      return data;
    });

    return indexData;
  }

  async massETFCrawl(date) {
    const page = this.page;

    // set headers to fool Fnguide
    await page.setExtraHTTPHeaders({
      Referer: 'http://fnguide.com/fgdd/StkEtf',
      'X-Requested-With': 'XMLHttpRequest',
    });

    // let indexURL = URL.API.index.format(this.todayDate)
    const ETFURL = URL.API.etf.format(date);
    await page.goto(ETFURL);
    const ETFData = await page.evaluate(() => {
      const data = JSON.parse(document.querySelector('body').innerText);
      return data;
    });

    return ETFData;
  }

  async massOHLCVCrawl(date) {
    const page = this.page;

    // set headers to fool Fnguide
    await page.setExtraHTTPHeaders({
      Referer: 'http://fnguide.com/fgdd/StkIndByTime',
      'X-Requested-With': 'XMLHttpRequest',
    });

    // let indexURL = URL.API.index.format(this.todayDate)
    const ohlcvURL = URL.API.ohlcv.format(date);
    await page.goto(ohlcvURL);
    const ohlcvData = await page.evaluate(() => {
      const data = JSON.parse(document.querySelector('body').innerText);
      return data;
    });

    return ohlcvData;
  }

  async massMktCapCrawl(date) {
    const page = this.page;

    // set headers to fool Fnguide
    await page.setExtraHTTPHeaders({
      Referer: 'http://fnguide.com/fgdd/StkItemDateCap',
      'X-Requested-With': 'XMLHttpRequest',
    });

    // let indexURL = URL.API.index.format(this.todayDate)
    const MktCapURL = URL.API.mkt_cap.format(date);
    await page.goto(MktCapURL);
    const mktCapData = await page.evaluate(() => {
      const data = JSON.parse(document.querySelector('body').innerText);
      return data;
    });

    return mktCapData;
  }

  async massBuysellCrawl(date) {
    const page = this.page;

    // set headers to fool Fnguide
    await page.setExtraHTTPHeaders({
      Referer: 'http://fnguide.com/fgdd/StkJInvTrdTrend',
      'X-Requested-With': 'XMLHttpRequest',
    });

    const buysellURL = URL.API.buysell.format(date);
    await page.goto(buysellURL);
    const buysellData = await page.evaluate(() => {
      const data = JSON.parse(document.querySelector('body').innerText);
      return data;
    });

    return buysellData;
  }

  async massFactorCrawl(date) {
    const page = this.page;

    // set headers to fool Fnguide
    await page.setExtraHTTPHeaders({
      Referer: 'http://www.fnguide.com/fgdd/StkDateShareIndx',
      'X-Requested-With': 'XMLHttpRequest',
    });

    const factorURL = URL.API.factor.format(date);
    await page.goto(factorURL);
    const factorData = await page.evaluate(() => {
      const data = JSON.parse(document.querySelector('body').innerText);
      return data;
    });

    return factorData;
  }

  async done() {
    await this.browser.close();
  }

}

module.exports = {
  Puppet,
}
