module.exports = {

  _get: function _get(obj, keys, defaults = null) {
    if (obj && Array.isArray(keys) && keys.length) {
      const key = keys.shift();
      return obj.hasOwnProperty(key) ? obj[key] : _get(obj, keys);
    } else {
      return defaults;
    }
  },

  promisify(fn) {
    return new Promise((resolve, reject) => {
      fn((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },

  promiseEachSeries(array, eachFn) {
    return array.reduce((p, v, i) => p.then(() => eachFn(v, i)), Promise.resolve());
  },

  promiseMapSeries(array, mapFn) {
    return array.reduce((p, v, i) => p.then(async r => r.concat(await mapFn(v, i))), Promise.resolve([]));
  },

  promiseReduceSeries(array, reduceFn, startValue) {
    return array.reduce((p, v, i) => p.then(r => reduceFn(r, v, i)), Promise.resolve(startValue || array[0] || null));
  },

  reduceObject(obj, reduceFn, startValue) {
    return Object.keys(obj).reduce((r, k, i, ks) => reduceFn(r, k, obj[k], i, ks), startValue || null);
  },

};
