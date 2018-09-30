// fnguide.js와 processor.js를 사용하는 방법입니다.
const axios = require('axios');

const { Puppet } = require('./fnguide.js');
const { Processor } = require('./processor.js');
const { RedisClient } = require('./cache.js');

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

const SAVE_DATA_URL = 'http://127.0.0.1:8000/api/v1/stocks/task/?type={0}&&env=local';

// 비동기식 처리가 많기 때문에 꼭 async 함수를 만들어서 사용하세요.
const main = async () => {
  const todayDate = new Date().toISOString().slice(0, 10).replace(/-/gi, '');

  // Redis 캐시 연결하여 데이터 저장할 준비
  const redis = new RedisClient();
  await redis.auth();

  const puppet = new Puppet('crawl'); // Puppet 클래스를 생성합니다.
  const processor = new Processor();

  const started = await puppet.startBrowser(false, 100); // 첫 번째 인자로 false를 넣으면 브라우저가 뜹니다.
  // 하지만, true를 하면, 브라우저가 백그라운드에서 돌아가게 됩니다.
  if (started == true) {
    await puppet.login(); // 브라우저가 실행되면, 로그인을 합니다.
  }

  ///// TASK 1: MASS DATE CRAWL /////
  const dateData = await puppet.massDateCrawl(); // API로 요청을 보내어 데이터를 가지고 옵니다.
  processor.setData(dateData);
  const processedDateData = await processor.processMassDate();
  console.log(processedDateData);
  await redis.delKey('mass_date');
  await redis.setList(processedDateData);
  await axios.get(SAVE_DATA_URL.format('SAVE_MASS_DATE'));

  const current_date = processedDateData.slice(-1)[0];

  ///// TASK 2: GET KOSPI TICKERS /////
  const kospiTickersData = await puppet.getKospiTickers(current_date);
  processor.setData(kospiTickersData);
  const processedKospiTickersData = await processor.processKospiTickers();
  console.log(processedKospiTickersData);
  await redis.delKey('kospi_tickers');
  await redis.setList(processedKospiTickersData);
  await axios.get(SAVE_DATA_URL.format('SAVE_KOSPI_TICKERS'));

  ///// TASK 3: GET KOSDAQ TICKERS /////
  const kosdaqTickersData = await puppet.getKosdaqTickers(current_date);
  processor.setData(kosdaqTickersData);
  const processeKosdaqTickersData = await processor.processKosdaqTickers();
  console.log(processeKosdaqTickersData);
  await redis.delKey('kosdaq_tickers');
  await redis.setList(processeKosdaqTickersData);
  await axios.get(SAVE_DATA_URL.format('SAVE_KOSDAQ_TICKERS'));

  // ///// TASK 4: MASS INDEX CRAWL /////
  // const indexData = await puppet.massIndexCrawl(todayDate);
  // processor.setData(indexData);
  // const processedIndexData = processor.processMassIndex();
  // console.log(processedIndexData);
  //
  // ///// TASK 4: MASS ETF CRAWL /////
  // const ETFData = await puppet.massETFCrawl(todayDate);
  // // processor.setData(indexData);
  // // const processedIndexData = processor.processMassIndex();
  // console.log(ETFData);

  // await puppet.done();
};

main();
