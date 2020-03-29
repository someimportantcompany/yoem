module.exports = {

  cleanUrl: (regex => url => url.replace(regex, ''))(/^https?:\/\/(www.)?/),

  _get: function _get(obj, keys, defaults = '') {
    if (obj && Array.isArray(keys) && keys.length) {
      const key = keys.shift();
      return obj.hasOwnProperty(key) ? `${obj[key]}` : _get(obj, keys);
    } else {
      return `${defaults}`;
    }
  },

  promisify(fn) {
    return new Promise((resolve, reject) => {
      fn((err, result) => err ? reject(err) : resolve(result));
    });
  },

  promiseEachSeries(array, eachFn) {
    return array.reduce((p, v, i) => p.then(() => eachFn(v, i)), Promise.resolve());
  },

  promiseMapSeries(array, mapFn) {
    return array.reduce((p, v, i) => p.then(async r => r.concat(await mapFn(v, i))), Promise.resolve([]));
  },

  promiseReduceSeries(array, reduceFn, startValue) {
    return array.reduce((p, v, i) => p.then(r => reduceFn(r, v, i)), Promise.resolve(startValue || array.shift() || null));
  },

  reduceObject(obj, reduceFn, startValue) {
    return Object.keys(obj).reduce((r, k, i, ks) => reduceFn(r, k, obj[k], i, ks), startValue || null);
  },

};
