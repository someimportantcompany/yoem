const assert = require('assert');
const fs = require('fs');
const path = require('path');
const settleAxios = require('axios/lib/core/settle');
const statuses = require('statuses');

module.exports = {

  createAxiosAdapter({ status, headers, data }) {
    return config => {
      assert(config, 'createApiResponse: Expected config');
      assert.strictEqual(config.responseType, 'text', 'createApiResponse: Expected responseType to equal text');

      return new Promise((resolve, reject) => {
        settleAxios(resolve, reject, {
          status,
          statusText: `${status} ${statuses[status]}`,
          headers,
          data,
          config,
          request: {},
        });
      });
    };
  },

  createRatio(values) {
    if (Array.isArray(values)) {
      values = values.reduce((l, k) => ({ ...l, [k]: (1 / values.length) }), {});
    }

    assert(Object.values(values).reduce((t, v) => t + v, 0) <= 1.0, 'Expected createRatio values to equal 1.0');

    let total = 0;
    const brackets = Object.keys(values).reduce((list, value) => {
      list[value] = [ total, total + values[value] ];
      total += values[value];
      return list;
    }, {});

    const pick = () => {
      const rand = Math.random();
      return Object.keys(brackets).find(k => rand >= brackets[k][0] && rand < brackets[k][1]) || null;
    };

    pick.keys = Object.keys(values);

    return pick;
  },

  getFixture(fixtureName) {
    return fs.readFileSync(path.resolve(__dirname, `./fixtures/${fixtureName}`), 'utf8');
  },

};
