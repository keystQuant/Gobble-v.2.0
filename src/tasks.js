const amqp = require('amqplib/callback_api');
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

// keyst-api-server
const SAVE_DATA_URL = 'http://45.76.202.71:3000/api/v1/stocks/task/?type={0}&&env=remote';


// RabbitMQ 태스크 정의
amqp.connect('amqp://admin:admin123@rabbit:5672//', (err, conn) => {
  conn.createChannel((err, ch) => {
    const q = 'crawl';

    ch.assertQueue(q, { durable: true });
    console.log("[*] %s 큐에서 데이터 수집 태스크를 기다리고 있습니다. 프로그램 종료를 위해서는 CTRL+C 를 누르세요.", q);
    ch.consume(q, async (task) => {
      const receivedTask = JSON.parse(task.content.toString());
      console.log("[x] 데이터 수집 요청 받음: " + receivedTask);

      // Redis 캐시 연결하여 데이터 저장할 준비
      const redis = new RedisClient();
      await redis.auth();

      // 모든 태스크는 퍼페티어를 기반으로 한다
      // 태스크를 받았다면 우선 크롬을 실행시킨다
      const puppet = new Puppet('crawl');
      const processor = new Processor();
      const started = await puppet.startBrowser(true, 100);
      if (started == true) {
        await puppet.login();
      }

      let updateStartSignalExists;
      let updateStart;
      let updateList;
      let updateDate;

      // 태스크 시작
      if (receivedTask === 'DATE') {
        updateStartSignalExists = await redis.keyExists('UPDATE_DATE');
        if (updateStartSignalExists === 1) {
          updateStart = await redis.getKey('UPDATE_DATE');
        } else {
          // 레디스 서버가 새서버여서 아무 데이터가 없다면 우선 태스크 실행시키기
          updateStart = 'True';
        }
        if (updateStart === 'True') {
          const dateData = await puppet.massDateCrawl(); // API로 요청을 보내어 데이터를 가지고 옵니다.
          processor.setData(dateData);
          const processedDateData = await processor.processMassDate();
          console.log(processedDateData);
          await redis.delKey('mass_date');
          await redis.setList(processedDateData);
          await axios.get(SAVE_DATA_URL.format('SAVE_MASS_DATE'))
            .catch(error => {
              console.log(error);
            });
        } else {
          console.log('Date already up to date, skipping update.');
        }
      }

      if (receivedTask === 'FNGUIDE') {
        ///// TICKER /////
        updateStartSignalExists = await redis.keyExists('UPDATE_TICKER');
        if (updateStartSignalExists === 1) {
          updateStart = await redis.getKey('UPDATE_TICKER');
        } else {
          updateStart = 'True';
        }
        if (updateStart === 'True') {
          updateList = await redis.getList('to_update_ticker_list');
          updateDate = updateList[0]; // 데이터값 하나만 업데이트한다
          ///// GET KOSPI TICKERS /////
          const kospiTickersData = await puppet.getKospiTickers(updateDate);
          processor.setData(kospiTickersData);
          const processedKospiTickersData = await processor.processKospiTickers();
          console.log(processedKospiTickersData);
          await redis.delKey('kospi_tickers');
          await redis.setList(processedKospiTickersData);
          await axios.get(SAVE_DATA_URL.format('SAVE_KOSPI_TICKERS'))
            .catch(error => {
              console.log(error);
            });
          ///// GET KOSDAQ TICKERS /////
          const kosdaqTickersData = await puppet.getKosdaqTickers(updateDate);
          processor.setData(kosdaqTickersData);
          const processeKosdaqTickersData = await processor.processKosdaqTickers();
          console.log(processeKosdaqTickersData);
          await redis.delKey('kosdaq_tickers');
          await redis.setList(processeKosdaqTickersData);
          await axios.get(SAVE_DATA_URL.format('SAVE_KOSDAQ_TICKERS'))
            .catch(error => {
              console.log(error);
            });
        } else {
          console.log('Tickers already up to date, skipping update.');
        }

        ///// STOCK INFO /////
        updateStartSignalExists = await redis.keyExists('UPDATE_STOCKINFO');
        if (updateStartSignalExists === 1) {
          updateStart = await redis.getKey('UPDATE_STOCKINFO');
        } else {
          updateStart = 'True';
        }
        if (updateStart == 'True') {
          updateList = await redis.getList('to_update_stockinfo_list');
          updateDate = updateList[0];
          const stockInfoData = await puppet.getStockInfo();
          processor.setData(stockInfoData);
          const processedStockInfoData = await processor.processStockInfo(updateDate);
          console.log(processedStockInfoData);
          await redis.delKey('stock_info');
          await redis.setList(processedStockInfoData);
          await axios.get(SAVE_DATA_URL.format('SAVE_STOCK_INFO'))
            .catch(error => {
              console.log(error);
            });
        } else {
          console.log('Stock Info already up to date, skipping update.');
        }

        ///// INDEX /////
        updateStartSignalExists = await redis.keyExists('UPDATE_INDEX');
        if (updateStartSignalExists === 1) {
          updateStart = await redis.getKey('UPDATE_INDEX');
        } else {
          updateStart = 'True';
        }
        if (updateStart == 'True') {
          updateList = await redis.getList('to_update_index_list');
          for (let date of updateList) {
            const indexData = await puppet.massIndexCrawl(date);
            processor.setData(indexData);
            const processedIndexData = await processor.processMassIndex(date);
            console.log(processedStockInfoData);
            await redis.delKey('mass_index');
            await redis.setList(processedIndexData);
            await axios.get(SAVE_DATA_URL.format('SAVE_MASS_INDEX'))
              .catch(error => {
                console.log(error);
              });
          }
        } else {
          console.log('Index already up to date, skipping update.');
        }
      }

      // 크롤링 태스크 완료 후에 puppeteer를 닫아주지 않으면, 메모리를 모두 사용하게 되어
      // 서버에 에러가 발생하거나, 크롤링 속도에 지장이 있다.
      // 그럴 경우 좀비 프로세스를 모두 주기적으로 제거하거나, 매번 태스크가 끝나면 프로세스를 꺼준다.
      await puppet.done();

    }, { noAck: false });
  });
});
