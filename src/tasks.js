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

// keyst-db-server
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

      // 태스크 시작
      if (receivedTask === 'DATE') {
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
      }

      if (receivedTask === 'TICKER') {
        const dateData = await puppet.massDateCrawl();
        processor.setData(dateData);
        const processedDateData = await processor.processMassDate();

        const current_date = processedDateData.slice(-1)[0];

        ///// GET KOSPI TICKERS /////
        const kospiTickersData = await puppet.getKospiTickers(current_date);
        processor.setData(kospiTickersData);
        const processedKospiTickersData = await processor.processKospiTickers();
        console.log(processedKospiTickersData);
        await redis.delKey('kospi_tickers');
        await redis.setList(processedKospiTickersData);
        // await axios.get(SAVE_DATA_URL.format('SAVE_KOSPI_TICKERS'));

        ///// GET KOSDAQ TICKERS /////
        const kosdaqTickersData = await puppet.getKosdaqTickers(current_date);
        processor.setData(kosdaqTickersData);
        const processeKosdaqTickersData = await processor.processKosdaqTickers();
        console.log(processeKosdaqTickersData);
        await redis.delKey('kosdaq_tickers');
        await redis.setList(processeKosdaqTickersData);
        // await axios.get(SAVE_DATA_URL.format('SAVE_KOSDAQ_TICKERS'));
      }

    }, { noAck: false });
  });
});
