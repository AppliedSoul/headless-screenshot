const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const _ = require('lodash');
const Promise = require('bluebird');

/**
 * BrowserScreenshot Highlevel library to export
 * screenshots from website using headless chrome
 *
 * This library internally uses puppeteer
 * @type {[type]}
 */
module.exports = class BrowserScreenshot {
  /**
   * constructor  initialization options
   * [see] (https://github.com/GoogleChrome/puppeteer/blob/3ae85e4649d4406a02882c543dc44dcf462a921f/docs/api.md#puppeteerlaunchoptions)
   * @param {object} options Takes same set of parameters as puppeteer launch options.
   */
  constructor(options) {
    this.options = options || {};
    this.browser = null;
    this.pages = [];
    this.usingPages = new Map();
  }

  getPage(opts) {
    let pageId = _.uniqueId('page_')
    let device = _.get(opts, 'device', null);
    let foundDevice = null;
    if (device && _.isString(device)) {
      let foundDeviceKey = _.findKey(devices, function(dev) {
        return dev.name.toLowerCase() === device.toLowerCase();
      })
      if (foundDeviceKey) {
        foundDevice = devices[foundDeviceKey];
      }
    }
    /*
    let pageResource = null;
    if (this.pages.length) {
      pageResource = this.pages.pop();
    } else {
      if (_.isNil(this.browser)) {
        throw new Error('browser not initialized');
      } else {
        pageResource = this.browser.newPage();
      }
    }

    return pageResource.then(page => {
        if (foundDevice) {
          return page.emulate(foundDevice);
        } else {
          return page;
        }
      }).then(page => {
        this.usingPages.set(pageId, page);
        return {
          id: pageId,
          page: page
        };
      })
    */
    let getPageResouce = () => new Promise((resolve, reject) => {
      if (this.pages.length) {
        resolve(this.pages.pop());
      } else {
        if (this.browser) {
          Promise.try(() => this.browser.newPage()).then(page => resolve(page)).catch(e => reject(e));
        } else {
          reject(new Error('browser not initialized'));
        }
      }
    });

    let pagePromise = () => new Promise((resolve, reject) => {
      getPageResouce()
        .then((page) => {
          if (foundDevice) {
            page.emulate(foundDevice).then(() => resolve(page)).catch(e => reject(e));
          } else {
            return resolve(page);
          }
        }).catch(e => {
          reject(e)
        });
    })

    return new Promise((resolve, reject) => {
      pagePromise().then((page) => {
        this.usingPages.set(pageId, page);
        return resolve({
          id: pageId,
          page: page
        });
      }).catch(e => reject(e));
    });

  }

  destroy() {
    return new Promise((resolve) => {
      if (this.browser) {
        if (this.pages.length || (!_.isEmpty(this.usingPages))) {
          _.concat(this.pages, Array.from(this.usingPages.values())).forEach(page => _.attempt(() => page.close().catch(e => {})));
        }
        _.attempt(() => this.browser.close().catch(e => {}));
        this.browser = null;
      }
      resolve();
    })
  }

  releasePage(pageData) {
    this.usingPages.delete(pageData.id);
    pageData.page.close().catch(e => {});
  }

  queuePage(pageData) {
    if (_.isObject(pageData)) {
      this.usingPages.delete(pageData.id);
      this.pages.push(pageData.page);
    }
  }

  /**
   * setup  - to be called before using the getScreenshot
   * It will launch the embedded chromium browser instance
   * @return {Promise}  When browser instance is available it returns promise with
   * object instance.
   */
  setup() {
    return new Promise((resolve, reject) => {
      puppeteer.launch(this.options).then(browser => {
        this.browser = browser;
        return resolve(this);
      }).catch(e => reject(e));
    });
  }

  /**
   * Get screenshot
   * @param  {String}  url           Request url address
   * @param  {Object}  [options={   Object same as page.screenshot option of puppeteer with additional properties
   * - @param   {Number}  timeout: defaulted to 10000 (seconds), if waitFor option is not specified - this is used.
   * - @param  {Boolean}  fullPage      if full page screenshot should be taken. Default is full page.
   * - @param  {String}  type          output type as png or jpg.
   * - @param  {String}  encoding      binary or base64
   * - @param  {Boolean} [reuse=false] reuse page for further requests after request is over - Pages are put inside a pool
   * @return {Promise[Object]}                Returns a promise - with result containing 
   * - @param   {String}  url            original url.
   * - @param  {String}  resolvedUrl    url which got resolved by the browser
   * - @param  {Buffer}  image          output type as png or jpg. having encoding of binary or jpg ( specified under options)
   * - @param  {Boolean} isReachable    If the website was reachable - some cases website is not reachable and blank screenshot is presented,
   * checking this option will handle these edge cases.
   */
  getScreenshot(url, options = {
    timeout: 10000,
    fullPage: true,
    type: 'png',
    encoding: 'binary'
  }, reuse = false) {
    let opts = _.extend(this.options, options);
    let waitFor = _.get(opts, 'waitFor', null);
    let timeout = _.get(opts, 'timeout', 10000);

    let pageData = null;
    return this.getPage(opts).then((data) => {
        pageData = data;
        let page = data.page;
        let getWaitingPage = () => {
          if (waitFor) {
            return page.goto(url, {
              waitFor: waitFor
            });
          } else {
            return Promise.race([page.goto(url), page.waitFor(timeout)]);
          }
        }
        return getWaitingPage().then(() => {
          return page.screenshot(opts).then(data => {
            let resolvedUrl = page.url();
            return {
              url: url,
              resolvedUrl: resolvedUrl,
              data: data,
              isReachable: !resolvedUrl.toLowerCase().startsWith('chrome-error:')
            };
          });
        });

      })
      .finally(() => {
        if (pageData) {
          if (reuse) {
            this.queuePage(pageData);
          } else {
            this.releasePage(pageData);
          }
        }
      })

  }
}