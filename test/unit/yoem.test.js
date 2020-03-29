const assert = require('assert');
const yoem = require('@src/yoem');

describe('src/yoem', () => {

  it('should export a function', () => assert.strictEqual(typeof yoem, 'function'));

  it('should throw an error if { url } is missing', async () => {
    try {
      await yoem({});
      this.fail('Should have thrown since { url } is missing');
    } catch (err) {
      assert.strictEqual(err.message, 'Expected { url } to be a string');
      assert.strictEqual(err.code, 'YOEM_NO_URL');
    }
  });

  it('should throw an error if { url } is within the { blacklist }', async () => {
    try {
      await yoem({
        url: 'https://daringfireball.net/2020/01/the_ipad_awkwardly_turns_10',
        blacklist: [ 'daringfireball.net/**' ],
      });
      this.fail('Should have thrown since { url } is within the { blacklist }');
    } catch (err) {
      assert.strictEqual(err.message, 'URL "daringfireball.net/2020/01/the_ipad_awkwardly_turns_10" is blacklisted');
      assert.strictEqual(err.code, 'YOEM_URL_BLACKLISTED');
    }
  });

  it('should throw an error if { url } is not within the { whitelist }', async () => {
    try {
      await yoem({
        url: 'https://daringfireball.net/2020/01/the_ipad_awkwardly_turns_10',
        whitelist: [ 'theverge.com/**' ],
      });
      this.fail('Should have thrown since { url } is not within the { whitelist }');
    } catch (err) {
      assert.strictEqual(err.message, 'URL "daringfireball.net/2020/01/the_ipad_awkwardly_turns_10" is blacklisted');
      assert.strictEqual(err.code, 'YOEM_URL_BLACKLISTED');
    }
  });

});
