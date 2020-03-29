const assert = require('http-assert');
const debug = require('debug')('yoem');
const micromatch = require('micromatch');
const ms = require('ms');
const statuses = require('statuses');

const defaultFallback = require('./fetchData');
const defaultServices = require('./services');
const { cleanUrl, reduceObject } = require('./utils');

module.exports = async function yoem({ url, services, fallback, timeout, ...opts } = {}) {
  let serviceName = null;

  try {
    const fetchStart = Date.now();

    assert(typeof url === 'string', 400, new Error('Expected { url } to be a string'), { code: 'YOEM_NO_URL' });
    fallback = typeof fallback === 'function' ? fallback : defaultFallback;
    services = services ? reduceObject(services, validateService, {}) : defaultServices;

    const cleaned = cleanUrl(url);
    serviceName = Object.keys(services).find(key => micromatch.any(cleaned, services[key].matches));
    const service = services[serviceName] || null;
    const fetchDataFn = (service ? service.get : null) || fallback;
    assert(typeof fetchDataFn === 'function', 500, new Error('Expected fetchData to be a function'), {
      code: 'YOEM_FETCH_NOT_FUNCTION',
    });

    debug(`${cleaned} ${serviceName}`);

    const embed = await fetchDataFn({
      url,
      service,
      timeout: ms(timeout || (service ? service.timeout : null) || '10s'),
      ...opts,
    });

    const fetchDate = (new Date()).toUTCString();
    const fetchEnd = Date.now() - fetchStart;

    return {
      embed: {
        type: null, // (required) The resource type
        version: null, // (required) The oEmbed version number
        title: null, // (optional) A text title, describing the resource
        // author_name: null, // (optional) The name of the author/owner of the resource
        // author_url: null, // (optional) A URL for the author/owner of the resource
        // provider_name: null, // (optional) The name of the resource provider
        // provider_url: null, // (optional) The url of the resource provider
        ...embed,
        fetch_date: fetchDate,
      },
      fetchDate,
      serviceName,
      timeTaken: ms(fetchEnd),
      timeTaken_ms: fetchEnd,
      url,
      urlCleaned: cleaned,
    };
  } catch (err) {
    err.serviceName = serviceName;
    err.status = err.status || 500;
    err.statusMessage = statuses[err.status];
    err.url = url;
    throw err;
  }
};

function validateService(list, key, { name, matches, get, url }) {
  try {
    assert(typeof name === 'string', new Error('Expected name to be a string'), {
      code: 'YOEM_MISSING_SERVICE_NAME',
    });
    assert(Array.isArray(matches) && matches.length, new Error('Expected matches to be an array'), {
      code: 'YOEM_MISSING_SERVICE_MATCHES',
    });

    assert(!url || [ 'function', 'string' ].includes(typeof url), new Error('Expected url to be a string or function'), {
      code: 'YOEM_MISSING_SERVICE_URL',
    });
    assert(typeof url !== 'string' || url.includes('{{url}}'), new Error('Expected url to have {{url}} placeholder'), {
      code: 'YOEM_INVALID_SERVICE_URL',
    });

    assert(!get || typeof get === 'function', new Error('Expected service.get to be a function'), {
      code: 'YOEM_INVALID_SERVICE_GETTER',
    });

    list[key] = { name, matches, get, url };
    return list;
  } catch (err) {
    err.message = `Invalid service passed to yoem "${key}": ${err.message}`;
    throw err;
  }
}
