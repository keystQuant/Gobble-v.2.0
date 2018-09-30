// Express 정의
const express = require('express');
const bodyParser = require('body-parser');

// RabbitMQ 정의
const amqp = require('amqplib/callback_api');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// RabbitMQ 태스크큐로 태스크를 전송하는 방법: 비동기식으로 그 태스크를 처리하기 위함이다
const sendToQueue = (msg) => {
  amqp.connect('amqp://admin:admin123@rabbit:5672//', (err, conn) => {
    conn.createChannel((err, ch) => {
      const q = 'crawl'; // 크롤링 작업에 필요한 큐를 정의내린다
      ch.assertQueue(q, { durable: true });
      ch.sendToQueue(q, new Buffer(JSON.stringify(msg)), { persistent: true });
      console.log("[x] 데이터 수집 요청 전송")
    });
  });
};

// Express앱을 8080 포트에서 실행시킨다
const server = app.listen(8080, () => {
  console.log('서버가 8080 포트에서 시작합니다');
});

const stopServer = () => {
  server.close();
};

// 테스크 api
app.get('/task/:taskname', async (req, res) => {
  const taskname = req.params.taskname;
  sendToQueue(taskname); // 태스크를 URL로 받아서 RabbitMQ로 보낸다
  res.status(200);
  res.send('DONE');
});
