const assert = require('assert');
const defaultServices = require('@src/services');
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
      assert.strictEqual(err.status, 400);
      assert.strictEqual(err.statusMessage, 'Bad Request');
    }
  });

  it('should throw an error if { services } contains an invalid service', async () => {
    try {
      await yoem({ url: 'https://discoverwestworld.com', services: { foo: {} } });
      this.fail('Should have thrown since { url } is missing');
    } catch (err) {
      assert.strictEqual(err.code, 'YOEM_MISSING_SERVICE_NAME');
      assert.strictEqual(err.message, 'Invalid service passed to yoem "foo": Expected name to be a string');
      assert.strictEqual(err.status, 500);
      assert.strictEqual(err.statusMessage, 'Internal Server Error');
      assert.strictEqual(err.url, 'https://discoverwestworld.com');
    }
  });

  it('should throw an error if { fallback } throws an error', async () => {
    try {
      await yoem({
        url: 'https://discoverwestworld.com',
        fallback() {
          throw new Error('THIS DOESN\'T LOOK LIKE ANYTHING TO ME');
        },
      });
      this.fail('Should have thrown since { url } is missing');
    } catch (err) {
      assert.strictEqual(err.code, undefined);
      assert.strictEqual(err.message, 'THIS DOESN\'T LOOK LIKE ANYTHING TO ME');
      assert.strictEqual(err.status, 500);
      assert.strictEqual(err.statusMessage, 'Internal Server Error');
      assert.strictEqual(err.url, 'https://discoverwestworld.com');
    }
  });

  it('should return the embed data', async () => {
    const result = await yoem({
      url: 'https://discoverwestworld.com',
      services: {
        ...defaultServices,
        westworld: {
          name: 'Westworld',
          matches: [ 'discoverwestworld.com/**' ],
          get: () => ({
            version: '1.0',
            type: 'link',
            title: 'Westworld',
            provider_name: 'Westworld',
            provider_url: 'https://discoverwestworld.com',
            description: 'These violent delights have violent ends',
            thumbnail_url: 'https://www.gstatic.com/tv/thumb/tvbanners/17848831/p17848831_b_v8_aa.jpg',
          }),
          url: ({ url }) => `https://discoverwestworld.com/oembed?url=${url}`,
        },
      },
      fallback() {
        throw new Error('Shouldn\'t attempt a network request');
      },
    });

    delete result.embed.fetch_date;
    delete result.fetchDate;
    delete result.timeTaken;
    delete result.timeTaken_ms;

    assert.deepStrictEqual(result, {
      embed: {
        type: 'link',
        version: '1.0',
        title: 'Westworld',
        provider_name: 'Westworld',
        provider_url: 'https://discoverwestworld.com',
        description: 'These violent delights have violent ends',
        thumbnail_url: 'https://www.gstatic.com/tv/thumb/tvbanners/17848831/p17848831_b_v8_aa.jpg',
      },
      serviceName: 'westworld',
      url: 'https://discoverwestworld.com',
      urlCleaned: 'discoverwestworld.com'
    });
  });

});
