FROM node:8
RUN npm install -g pm2
COPY . /src
WORKDIR /src
RUN npm install
CMD pm2 start --no-daemon gobble.js
