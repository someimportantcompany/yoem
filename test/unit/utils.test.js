const assert = require('assert');
const utils = require('@src/utils');

describe('src/utils', () => {

  it('should clean a URL', () => {
    const { cleanUrl } = utils;
    assert.strictEqual(cleanUrl('https://www.discoverwestworld.com'), 'discoverwestworld.com');
    assert.strictEqual(cleanUrl('http://discoverwestworld.com'), 'discoverwestworld.com');
    assert.strictEqual(cleanUrl('www.discoverwestworld.com'), 'www.discoverwestworld.com');
    assert.strictEqual(cleanUrl('beta.discoverwestworld.com'), 'beta.discoverwestworld.com');
    assert.strictEqual(cleanUrl('https://beta.discoverwestworld.com'), 'beta.discoverwestworld.com');
  });

  it('should return the first non-null value', () => {
    const { _get } = utils;
    const data = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    };
    assert.strictEqual(_get(data, [ 'a', 'b' ]), '1');
    assert.strictEqual(_get(data, [ 'z', 'b' ]), '2');
    assert.strictEqual(_get(data, [ 'y', 'c', 'b' ]), '3');
    assert.strictEqual(_get(data, [ 'z', 'y', 'x' ]), '');
    assert.strictEqual(_get(data, []), '');
  });

  it('should return a promise when a callback is required', async () => {
    const { promisify } = utils;

    const res = await promisify(callback => callback(null, 'These violent delights having violent ends'));
    assert.strictEqual(res, 'These violent delights having violent ends');

    try {
      await promisify(callback => callback(new Error('These violent delights having violent ends')));
      assert.fail('Should have thrown the error returned in the callback');
    } catch (err) {
      assert.strictEqual(err.message, 'These violent delights having violent ends');
    }
  });

  it('should iterate through an array in series, not returning results like Array.forEach', async () => {
    const { promiseEachSeries } = utils;
    const output = [];
    await promiseEachSeries([ 2, 3, 4 ], i => output.push(i * i));
    assert.deepStrictEqual(output, [ 4, 9, 16 ]);
  });

  it('should iterate through an array in series, returning results like Array.map', async () => {
    const { promiseMapSeries } = utils;
    const output = await promiseMapSeries([ 2, 3, 4 ], i => i * i);
    assert.deepStrictEqual(output, [ 4, 9, 16 ]);
  });

  it('should iterate through an array in series, returning results like Array.reduce', async () => {
    const { promiseReduceSeries } = utils;
    const output1 = await promiseReduceSeries([ 2, 3, 4 ], (t, i) => t + i, 1);
    assert.strictEqual(output1, 10);

    const output2 = await promiseReduceSeries([ 1, 2, 3, 4 ], (t, i) => t + i);
    assert.strictEqual(output2, 10);
  });

  it('should iterate through an object, reducing it like Array.reduce', () => {
    const { reduceObject } = utils;
    const output = reduceObject({ hello: 'world' }, (list, key, value) => list.concat([ key, value ]), []);
    assert.deepStrictEqual(output, [ 'hello', 'world' ]);
  });

});
