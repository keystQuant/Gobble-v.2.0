String.prototype.format = function () {
  // es5 synatax
  // finds '{}' within string values and replaces them with
  // given parameter values in the .format method
  let formatted = this;
  for (let i = 0; i < arguments.length; i++) {
    const regexp = new RegExp(`\\{${i}\\}`, 'gi');
    formatted = formatted.replace(regexp, arguments[i]);
  }
  return formatted;
};

class Processor {
  constructor(data = '') {
    this.data = data;
  }

  setData(data) {
    this.data = data;
  }

  async processMassDate() {
    const datesData = ['mass_date'];
    try{
      for (const obj of this.data.Data) {
        for (const jsonData of obj) {
          const dateData = jsonData.TRD_DT.replace(/\./gi, '').trim();
          datesData.push(dateData);
        }
      }
    } catch (e) { console.log(e); }

    return datesData;
  }

  async processKospiTickers() {
    const kospiTickersData = ['kospi_tickers'];

    for (const obj of this.data.Data) {
      for (const jsonData of obj) {
        const data = jsonData.GICODE + '|' + jsonData.ITEMABBRNM;
        kospiTickersData.push(data);
      }
    }

    return kospiTickersData;
  }

  async processKosdaqTickers() {
    const kosdaqTickersData = ['kosdaq_tickers'];

    for (const obj of this.data.Data) {
      for (const jsonData of obj) {
        const data = jsonData.GICODE + '|' + jsonData.ITEMABBRNM;
        kosdaqTickersData.push(data);
      }
    }

    return kosdaqTickersData;
  }

  async processETFTickers() {
    const ETFTickersData = ['etf_tickers'];

    for (const obj of this.data.Data) {
      for (const jsonData of obj) {
        const data = jsonData.GICODE + '|' + jsonData.ITEMABBRNM;
        ETFTickersData.push(data);
      }
    }

    return ETFTickersData;
  }

  async processStockInfo(date) {
    const jsonDate = date;

    const stockInfoData = ['stock_info'];
    for (const obj of this.data.Data) {
      for (const json of obj) {
        const jsonMashed = '{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}|{8}'.format(
          jsonDate,
          json.GICODE,
          json.ITEMABBRNM,
          json.STK_KIND,
          json.MKT_GB,
          json.MKT_CAP,
          json.MKT_CAP_SIZE,
          json.FRG_HLD,
          json.MGT_GB,
        ); // fill in semi colon separated string
        stockInfoData.push(jsonMashed);
      } // inner for loop
    } // outer for loop

    return stockInfoData;
  }

  async processMassIndex(date) {
    const jsonDate = date;

    const indexData = ['mass_index'];
    for (const obj of this.data.Data) {
      for (const json of obj) {
        const jsonMashed = '{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}|{8}'.format(
          jsonDate,
          json.U_CD,
          json.U_NM,
          json.STRT_PRC,
          json.HIGH_PRC,
          json.LOW_PRC,
          json.CLS_PRC,
          json.TRD_QTY,
          json.TRD_AMT,
        ); // fill in semi colon separated string
        indexData.push(jsonMashed);
      } // inner for loop
    } // outer for loop

    return indexData;
  }

  async processMassETF(date) {
    const jsonDate = date;

    const ETFData = ['mass_etf'];
    for (const obj of this.data.Data) {
      for (const json of obj) {
        const jsonMashed = '{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}'.format(
          jsonDate,
          json.GICODE,
          json.ITEMABBRNM,
          json.CLS_PRC,
          json.TRD_QTY,
          json.TRD_AMT,
          json.ETF_NAV,
          json.SPREAD
        ); // fill in semi colon separated string
        ETFData.push(jsonMashed);
      } // inner for loop
    } // outer for loop

    return ETFData;
  }

  async processMassOHLCV(date) {
    const jsonDate = date;

    const ohlcvData = ['mass_ohlcv'];
    for (const obj of this.data.Data) {
      for (const json of obj) {
        const jsonMashed = '{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}|{8}|{9}|{10}'.format(
          jsonDate,
          json.GICODE,
          json.ITEMABBRNM,
          json.STRT_PRC,
          json.HIGH_PRC,
          json.LOW_PRC,
          json.CLS_PRC,
          json.ADJ_PRC,
          json.TRD_QTY,
          json.TRD_AMT,
          json.SHTSALE_TRD_QTY,
        ); // fill in semi colon separated string
        ohlcvData.push(jsonMashed);
      } // inner for loop
    } // outer for loop

    return ohlcvData;
  }

  async processMktCap(date) {
    const jsonDate = date;

    const mktCapData = ['mass_marketcapital'];
    for (const obj of this.data.Data) {
      for (const json of obj) {
        const jsonMashed = '{0}|{1}|{2}|{3}|{4}'.format(
          jsonDate,
          json.GICODE,
          json.ITEMABBRNM,
          json.COMM_STK_QTY,
          json.PREF_STK_QTY,
        ); // fill in semi colon separated string
        mktCapData.push(jsonMashed);
      } // inner for loop
    } // outer for loop

    return mktCapData;
  }

  async processMassBuysell(date) {
    const jsonDate = date;

    const buysellData = ['mass_buysell'];
    for (const obj of this.data.Data) {
      for (const json of obj) {
        const jsonMashed = '{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}|{8}|{9}|{10}|{11}|{12}|{13}|{14}|{15}|{16}|{17}|{18}|{19}|{20}'.format(
          jsonDate,
          json.GICODE,
          json.GINAME,
          json.FORGN_B,
          json.FORGN_S,
          json.FORGN_N,
          json.PRIVATE_B,
          json.PRIVATE_S,
          json.PRIVATE_N,
          json.INST_SUM_B,
          json.INST_SUM_S,
          json.INST_SUM_N,
          json.TRUST_B,
          json.TRUST_S,
          json.TRUST_N,
          json.PENSION_B,
          json.PENSION_S,
          json.PENSION_N,
          json.ETC_INST_B,
          json.ETC_INST_S,
          json.ETC_INST_N,
        ); // fill in semi colon separated string
        buysellData.push(jsonMashed);
      } // inner for loop
    } // outer for loop

    return buysellData;
  }

  async processMassFactor(date) {
    const jsonDate = date;

    const factorData = ['mass_factor'];
    for (const obj of this.data.Data) {
      for (const json of obj) {
        const jsonMashed = '{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}'.format(
          jsonDate,
          json.GICODE,
          json.ITEMABBRNM,
          json.PER,
          json.PBR,
          json.PCR,
          json.PSR,
          json.DIVID_YIELD,
        ); // fill in semi colon separated string
        factorData.push(jsonMashed);
      } // inner for loop
    } // outer for loop

    return factorData;
  }
}

module.exports = {
  Processor,
};
