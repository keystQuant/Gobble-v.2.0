const redis = require('redis');
const asyncRedis = require('async-redis'); // wrapper for regular redis library
// regular redis library does not return promises
// use async-redis to change redis tasks synchronous

const CACHE_IP = '198.13.60.78';
const PW = 'da56038fa453c22d2c46e83179126e97d4d272d02ece83eb83a97357e842d065';


class RedisClient {
  constructor() {
    console.log('Connecting to cache server (Redis) on Gobble server');
    this.initialRedisClient = redis.createClient(6379, CACHE_IP);
    this.redisClient = asyncRedis.decorate(this.initialRedisClient);
  }

  async auth() {
    // user login for Redis server (security purposes)
    const response = await this.redisClient.auth(PW);
    return response;
  }

  // regular set, get of single values
  async setKey(key, value) {
    const response = await this.redisClient.set(key, value);
    if (response === 'OK') {
      return true; // return true if key successfully set
    }
    return false; // return false if key failed to set
  }

  async getKey(key) {
    const response = await this.redisClient.get(key);
    return response; // returns value of key
  }

  // functions to check whether key exists or to delete key value
  async keyExists(key) {
    const exists = await this.redisClient.exists(key);
    return exists; // returns 0 or 1
  }

  async delKey(key) {
    const response = await this.redisClient.del(key);
    return response; // returns 0 or 1
  }

  // set, get operation for list values
  async setList(data) {
    const response = await this.redisClient.rpush(data);
    return response; // returns length of list
  }

  async getList(key, type) {
    // type can be: int, float, str etc.
    // all these types are so that Python app could use the data later on
    let response = await this.redisClient.lrange(key, 0, -1);
    if (type === 'int') {
      // check if element of list contains integer value
      // if so, change the element type to int
      // else, since the function parseInt on that element will return NaN
      // simply skip the below condition block
      if (!isNaN(parseInt(response[0], 10))) {
        response = response.map(x => parseInt(x, 10));
      }
    }
    return response; // returns the list
  }

  // add to existing list of key
  async addToList(key, data) {
    const response = await this.redisClient.rpush(key, data);
    return response;
  }

  // set, get operations for JSON values
  async setJSON(key, json) {
    const response = this.redisClient.hset(key, 'a', JSON.stringify(json));
    return response; // returns 0 or 1
  }

  async getJSON(key) {
    const response = await this.redisClient.hget(key, 'a');
    const json = JSON.parse(response); // parse response to json object
    return json; // returns json object
  }

  async delJSON(key) {
    const response = await this.redisClient.hdel(key, 'a');
    return response; // returns 0 or 1
  }

  async end() {
    console.log('Disconnecting Redis client');
    this.redisClient.quit();
  }
}

module.exports = {
  RedisClient,
};
