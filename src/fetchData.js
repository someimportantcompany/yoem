const assert = require('http-assert');
const axios = require('axios');
const cheerio = require('cheerio');
const debug = require('debug')('yoem:fetchData');
const micromatch = require('micromatch');
const suq = require('suq');
const { format: formatUrl, parse: parseUrl } = require('url');

const parse = require('./parse');
const { _get, promisify } = require('./utils');

module.exports = async function fetchData(opts, numRedirects = 0) {
  const { service, timeout, maxRedirects = 3 } = opts;
  assert(numRedirects < maxRedirects, 400, new Error('Too many redirects'), {
    code: 'YOEM_FETCH_TOO_MANY_REDIRECTS',
  });

  let { url } = opts;

  if (service) {
    if (typeof service.url === 'string') {
      url = service.url.replace('{{url}}', url);
    } else if (typeof service.url === 'function') {
      url = service.url.replace('{{url}}', { url, ...opts });
    }
  }

  debug({ url });
  const { status, headers, data } = await (opts.axios || axios).get(url, {
    maxRedirects: 0,
    responseType: 'text',
    timeout,
    validateStatus: s => s >= 200 && s < 400,
  }).catch(err => {
    if (err && err.response && err.response.status) {
      assert(false, 400, new Error(`Non-200 response returned: ${err.response.status}`), {
        code: 'YOEM_FETCH_NON_2XX',
      });
    } else {
      throw err;
    }
  });

  debug({ url, status, headers });

  if (status > 300) {
    const { location } = headers || {};
    assert(typeof location === 'string', 400, new Error('Failed to follow location'), {
      code: 'YOEM_FETCH_REDIRECT_LOCATION_MISSING',
    });

    if (Array.isArray(opts.blacklist) || Array.isArray(opts.whitelist)) {
      const cleaned = location.replace(/^https?:\/\/(www.)?/, '');
      assert(!Array.isArray(opts.blacklist) || !micromatch.any(cleaned, opts.blacklist),
        400, new Error(`URL "${cleaned}" is blacklisted`), { code: 'YOEM_URL_BLACKLISTED', name: 'BlacklistError' });
      assert(!Array.isArray(opts.whitelist) || micromatch.any(cleaned, opts.whitelist),
        400, new Error(`URL "${cleaned}" is not whitelisted`), { code: 'YOEM_URL_BLACKLISTED', name: 'BlacklistError' });
    }

    debug({ redirecting: location });
    return fetchData({ ...opts, url: location, service: null }, numRedirects + 1);
  } else if (service) {
    try {
      const { 'content-type': contentType } = headers || {};

      const parser = Object.values(parse).find(search => {
        const { contentTypes } = search;
        return Array.isArray(contentTypes) && micromatch.any(contentType, contentTypes);
      });

      assert(parser && typeof parser.parse === 'function', new Error(`Failed to find parser for: ${contentType}`));
      debug({ parser: contentType });

      const result = await parser.parse(data);
      debug({ url, result });
      return result;
    } catch (err) {
      assert(false, 500, err, { code: 'YOEM_FETCH_PARSE_FAILED' });
    }
  } else {
    const { 'content-type': contentType } = headers || {};
    assert(contentType.includes('text/html'), new Error('Expected text/html body'));

    if (containsOembedReference(data)) {
      debug({ getOembedReferenceURL: url });
      const location = getOembedReferenceURL(data);

      if (Array.isArray(opts.blacklist) || Array.isArray(opts.whitelist)) {
        const cleaned = location.replace(/^https?:\/\/(www.)?/, '');
        assert(!Array.isArray(opts.blacklist) || !micromatch.any(cleaned, opts.blacklist),
          400, new Error(`URL "${cleaned}" is blacklisted`), { code: 'YOEM_URL_BLACKLISTED', name: 'BlacklistError' });
        assert(!Array.isArray(opts.whitelist) || micromatch.any(cleaned, opts.whitelist),
          400, new Error(`URL "${cleaned}" is not whitelisted`), { code: 'YOEM_URL_BLACKLISTED', name: 'BlacklistError' });
      }

      debug({ redirecting: location });
      return fetchData({ ...opts, url: location, service: null }, numRedirects + 1);
    }

    try {
      debug({ parseOembedTags: url });
      const parsedData = await promisify(callback => suq.parse(data, callback));
      const parsedUrl = parseUrl(url);

      var result = {
        version: '1.0',
        type: 'link',
        title: _get(parsedData.opengraph, [ 'og:title' ], '').trim() ||
          _get(parsedData.meta, [ 'twitter:title' ], '').trim() ||
          _get(parsedData.tags, [ 'title' ], '').trim() ||
          null,
        provider_name: _get(parsedData.opengraph, [ 'og:site_name' ], '').trim() ||
          parsedUrl.hostname,
        provider_url: _get(parsedData.meta, 'twitter:domain', '').trim() ||
          formatUrl({ protocol: parsedUrl.protocol, hostname: parsedUrl.hostname }),
        description: _get(parsedData.opengraph, [ 'og:description' ], '').trim() ||
          _get(parsedData.meta, [ 'twitter:description' ], '').trim() ||
          _get(parsedData.tags, [ 'description' ], '').trim() ||
          null,
      };

      if (_get(parsedData.opengraph, [ 'og:image' ])) {
        result.thumbnail_url = _get(parsedData.opengraph, [ 'og:image' ]);
        if (_get(parsedData.opengraph, [ 'og:image:height' ]) && _get(parsedData.opengraph, [ 'og:image:width' ])) {
          result.thumbnail_height = _get(parsedData.opengraph, [ 'og:image:height' ]);
          result.thumbnail_width = _get(parsedData.opengraph, [ 'og:image:width' ]);
        }
      }

      // Providers may optionally include any parameters not specified in this document (so long as they use the same
      // key-value format) and consumers may choose to ignore these. Consumers must ignore parameters they do not
      // understand.

      if (_get(parsedData.opengraph, [ 'og:video:secure_url', 'og:video:url' ])) {
        // If video_url is present, video_width and video_height should also be present.
        if (_get(parsedData.opengraph, [ 'og:video:height' ]) && _get(parsedData.opengraph, [ 'og:video:width' ])) {
          result.video_url = _get(parsedData.opengraph, [ 'og:video:secure_url', 'og:video:url' ]).trim();
          result.video_height = _get(parsedData.opengraph, 'og:video:height');
          result.video_width = _get(parsedData.opengraph, 'og:video:width');
        }
      }

      // Fallback thumbnail in the case there aren't any relevant tags?
      // if (!result.thumbnail_url && _get(data, 'tags.images') && Array.isArray(parsedData.tags.images)) {
      //   result.thumbnail_url = parsedData.tags.images.shift();
      //   if (result.thumbnail_url.indexOf('http') !== 0 && result.thumbnail_url.indexOf('/') === 0) {
      //     // Browser resolve right here?!
      //   }
      // }

      debug({ url, result });
      return result;
    } catch (err) {
      assert(false, 500, err, { code: 'YOEM_FETCH_PARSE_FAILED' });
    }
  }
};

function containsOembedReference(body) {
  return typeof body === 'string' && (
    body.includes('application/json+oembed') ||
    body.includes('text/json+oembed') ||
    body.includes('text/javascript+oembed') ||
    body.includes('text/xml+oembed')
  );
}

function getOembedReferenceURL(body) {
  const $ = cheerio.load(body);
  const links = [];

  $('head').find('link').each((i, el) => {
    const $el = $(el);
    if (containsOembedReference($el.attr('type'))) {
      links.push($el.attr('href'));
    }
  });

  // If we have multiple, one of them may be JSON, thus take priority over any others
  return links.find(href => micromatch.any(href, [ '**json**', '**javascript**' ])) || links.shift();
}
