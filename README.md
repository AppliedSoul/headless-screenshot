# headless-screenshot
[![npm package](https://nodei.co/npm/headless-screenshot.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/headless-screenshot/)</br>

 [![Build Status](https://travis-ci.org/AppliedSoul/headless-screenshot.svg?branch=master)](https://travis-ci.org/AppliedSoul/headless-screenshot) [![Coverage Status](https://coveralls.io/repos/github/AppliedSoul/headless-screenshot/badge.svg?branch=master)](https://coveralls.io/github/AppliedSoul/crawlmatic?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/AppliedSoul/headless-screenshot.svg)](https://greenkeeper.io/)   


headless-screenshot is a high-level on top of headless embedded chromium browser (puppeteer). It provides safe & easy to use interface for taking screenshot of websites.   

Built with :heart:


 Usage:
```javascript
const HeadShot = require('headless-screenshot');
const Promise = require('bluebird');
const writeFile = Promise.promisify(require('fs').writeFile);

let hc = new HeadShot() // browser instance
hc.setup() // launches embedded chromium instance
  .then(() =>
    hc.getScreenshot('https://example.com')
    .then( res => {
      console.log(`resolvedUrl: ${res.resolvedUrl}, originalUrl: ${res.url}, isReachable: ${res.isReachable}`);
        writeFile('./example.png',res.data).then(() => console.log('file is written'));
    }).finally(() => hc.destroy())
```

For reference look at test cases.
