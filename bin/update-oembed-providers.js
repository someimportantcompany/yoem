/**
 * Pull the latest Oembed spec and make available to this project.
 * @link https://oembed.com
 * @link https://github.com/iamcal/oembed
 */
const _camelCase = require('lodash/camelCase');
const assert = require('http-assert');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { name: PACKAGE_NAME, version: PACKAGE_VERSION } = require('../package.json');

(async () => {
  /* eslint-disable no-console,no-process-exit */

  /**
   * List of Oembed providers we are handling ourselves
   * @var {Array<String>}
   */
  const ignore = [ 'Facebook', 'Twitter', 'WordPress.com', 'YouTube' ];

  /**
   * Remove the (https://|https://|www.) prefixes and change the wildcard
   * @param {String}
   * @return {String}
   */
  const formatScheme = s => s.replace(/^https?:\/\/(www.)?/, '').replace(/\*$/, '**').replace(/\*{2,}$/, '**');
  /**
   * Remove duplicates from an array
   * @param {Array<T>}
   * @return {Array<T>}
   */
  const uniqArray = arr => arr.reduce((l, v) => l.includes(v) ? l : l.concat(v), []);

  try {
    const { status, headers, data } = await axios.get('https://oembed.com/providers.json', {
      headers: { 'user-agent': `${PACKAGE_NAME} v${PACKAGE_VERSION}` },
      responseType: 'json',
    });

    assert(status === 200, new Error('Expected providers endpoint to return HTTP 200 OK'));
    assert(Array.isArray(data) && data.length, new Error('Expected providers endpoint to return an array'));
    console.log(JSON.stringify({ status, headers }, null, 2));

    const providers = data.reduce((list, provider) => {
      assert(provider && provider.provider_name, new Error('Expected provider to have a name'));

      if (ignore.includes(provider.provider_name)) {
        // console.log('Ignoring %s', provider.provider_name);
        return list;
      }

      const key = _camelCase(provider.provider_name);

      (Array.isArray(provider.endpoints) ? provider.endpoints : []).forEach((endpoint, i) => {
        const service = {
          name: provider.provider_name,
          matches: Array.isArray(endpoint.schemes) && endpoint.schemes.length
            ? uniqArray(endpoint.schemes.map(formatScheme))
            : [ formatScheme(`${provider.provider_url}*`) ],
          url: `${endpoint.url.replace('.{format}', '.json')}${endpoint.url.includes('?') ? '&' : '?'}url={{url}}`,
        };

        const suffix = provider.endpoints.length > 1 ? `${(i + 1)}` : '';
        list[`${key}${suffix}`] = service;
      });

      return list;
    }, {});

    fs.writeFileSync(path.resolve(__dirname, '../src/oembed.json'), JSON.stringify(providers, null, 2), 'utf8');
    console.log('Written %d providers to src/oembed.json', Object.keys(providers).length);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
