const _ = require('lodash');
const Promise = require('bluebird');
const HeadShot = require('../index');

describe('Screenshot Tests', function() {

  describe('Launch destroy tests', function() {
    it('should launch headless chrome instance', function() {
      let hc = new HeadShot();
      hc.setup().then(hc => !_.isNull(hc.browser)).finally(() => hc.destroy())
        .should.eventually.be.true
    })

    it('should be able to safely reject requests when browser is destroyed', function() {
      let hc = new HeadShot();
      return hc.setup().then(() => {
          hc.destroy();
          return hc.getScreenshot('https://example.com');
        }).finally(() => hc.destroy())
        .should.eventually.be.rejected
    })

    it('should safely handle requests with wrong urls', function() {
      let hc = new HeadShot({
        timeout: 10000
      });
      return hc.setup().then(() => hc.getScreenshot('badurl'))
        .finally(() => hc.destroy()).should.eventually.be.rejected
    })

    it('should get screenshot from example website on http requests', function() {
      hc = new HeadShot();
      return hc.setup().then(() => hc.getScreenshot('https://example.com')).finally(() => hc.destroy())
        .then(res => res.isReachable).should.eventually.be.true
    })

    it('should work with waitFor calls', function() {
      hc = new HeadShot();
      return hc.setup().then(() => hc.getScreenshot('https://example.com', {
          waitFor: 'load'
        })).finally(() => hc.destroy())
        .then(res => res.isReachable).should.eventually.be.true
    })

    it('should launch multiple pages and handle destroy before page close', function() {
      hc = new HeadShot();
      return hc.setup().then(() => {
        _.times(2, () => hc.getScreenshot('https://example.com').catch(e => {}));
        return hc.destroy()
      }).should.eventually.be.fulfilled;
    })

    it('should handle setup failure edge cases', function() {
      hc = new HeadShot({
        executablePath: '/thispath/dont/exists'
      });
      return hc.setup().finally(() => hc.destroy()).should.eventually.be.rejected;
    })

  })

  describe('Reuse Tests', function() {
    let nc = new HeadShot();

    it('should be able to setup chromium instance', function() {
      return nc.setup().then(nc => !_.isNil(nc.browser)).should.eventually.be.true;
    })

    it('should able to get image from TLS website with reuse flag set - case 1', function() {
      return nc.getScreenshot('https://www.example.com', {}, true).then(res => res.isReachable).should.eventually.be.true
    })

    it('should able to get image from website with reuse flag set - case 2', function() {
      return nc.getScreenshot('http://www.example.com', {}, true).then(res => res.isReachable).should.eventually.be.true
    })

    it('should able to destroy browser instance', function() {
      return nc.destroy().should.eventually.be.fulfilled;
    })

  })

  describe("Device Tests", function() {
    let nc = null;

    it('should able to setup browser connection', function() {
      nc = new HeadShot();
      return nc.setup().should.eventually.be.fulfilled;
    })

    it('should get image from example website on TLS enabled connection IPHONE(iPhoneX)', function() {
      return nc.getScreenshot('https://bing.com', {
        device: 'iPhone X'
      }).then(res => res.isReachable).should.eventually.be.true;
    })

    it('should get image from example website enabled connection ANDROID(Nexus 10)', function() {
      return nc.getScreenshot('http://example.com', {
        device: 'Nexus 10'
      }).then(res => res.isReachable).should.eventually.be.true;
    })

    it('should able to destroy browser instance', function() {
      return nc.destroy().should.eventually.be.fulfilled;
    })
  })

})