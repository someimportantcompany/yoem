const assert = require('assert');
const axios = require('axios');
const fetchData = require('@src/fetchData');
const { createAxiosAdapter, createRatio, getFixture } = require('@test/utils');

const url = createRatio([
  'https://daringfireball.net/2020/01/the_ipad_awkwardly_turns_10',
]);

describe('src/fetchData', () => {

  it('should export a function', () => assert.strictEqual(typeof fetchData, 'function'));

  it('should throw an error if { url } is missing', async () => {
    try {
      await fetchData({});
      this.fail('Should have thrown since { url } is missing');
    } catch (err) {
      assert.strictEqual(err.message, 'Expected { url } to be a string');
      assert.strictEqual(err.code, 'YOEM_NO_URL');
    }
  });

  it('should throw an error if { url } is within the { blacklist }', async () => {
    try {
      await fetchData({
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
      await fetchData({
        url: 'https://daringfireball.net/2020/01/the_ipad_awkwardly_turns_10',
        whitelist: [ 'theverge.com/**' ],
      });
      this.fail('Should have thrown since { url } is not within the { whitelist }');
    } catch (err) {
      assert.strictEqual(err.message, 'URL "daringfireball.net/2020/01/the_ipad_awkwardly_turns_10" is blacklisted');
      assert.strictEqual(err.code, 'YOEM_URL_BLACKLISTED');
    }
  });

  it('should throw an error if { maxRedirects } is exceeded', async () => {
    try {
      await fetchData({
        url: url(),
        maxRedirects: 3,
      }, 3);
      this.fail('Should have thrown since { url } is not within the { whitelist }');
    } catch (err) {
      assert.strictEqual(err.message, 'Too many redirects');
      assert.strictEqual(err.code, 'YOEM_FETCH_TOO_MANY_REDIRECTS');
    }
  });

  it('should throw an error if res.status >= 400', async () => {
    try {
      await fetchData({
        url: 'https://open.spotify.com/track/5e9TFTbltYBg2xThimr0rU?si=25aDNKDiT3iHNGZ5eFPkZQ',
        service: {
          name: 'Spotify',
          url: 'https://embed.spotify.com/oembed/?url={{url}}'
        },
        axios: axios.create({
          adapter: createAxiosAdapter({
            status: 503,
            headers: { 'content-type': 'text/html' },
            data: 'Server down for maintenance',
          }),
        }),
      });
      this.fail('Should have thrown since res.status === 503');
    } catch (err) {
      assert.strictEqual(err.message, 'Non-200 response returned: 503');
      assert.strictEqual(err.code, 'YOEM_FETCH_NON_2XX');
    }
  });

  it('should throw an error if axios failed to make the req', async () => {
    try {
      await fetchData({
        url: 'https://open.spotify.com/track/5e9TFTbltYBg2xThimr0rU?si=25aDNKDiT3iHNGZ5eFPkZQ',
        service: {
          name: 'Spotify',
          url: 'https://embed.spotify.com/oembed/?url={{url}}'
        },
        axios: axios.create({
          adapter: () => Promise.reject(new Error('Failed to make http req')),
        }),
      });
      this.fail('Should have thrown since the http req was blocked');
    } catch (err) {
      assert.strictEqual(err.message, 'Failed to make http req');
      assert.strictEqual(err.code, undefined);
    }
  });

  it('should transform a service.url string and return the Oembed data', async () => {
    const data = {
      'html': '<iframe width="300" height="380" allowtransparency="true" frameborder="0" allow="encrypted-media" title="Spotify Embed: The Chain - 2004 Remaster" src="https://open.spotify.com/embed/track/5e9TFTbltYBg2xThimr0rU?si=cZLrT6n0SiKZSWeoYpyi0w"></iframe>',
      'width': 300,
      'height': 380,
      'version': '1.0',
      'provider_name': 'Spotify',
      'provider_url': 'https://www.spotify.com',
      'type': 'rich',
      'title': 'The Chain - 2004 Remaster',
      'thumbnail_url': 'https://i.scdn.co/image/ab67616d00001e02e52a59a28efa4773dd2bfe1b',
      'thumbnail_width': 300,
      'thumbnail_height': 300
    };

    const result = await fetchData({
      url: 'https://open.spotify.com/track/5e9TFTbltYBg2xThimr0rU?si=25aDNKDiT3iHNGZ5eFPkZQ',
      service: {
        name: 'Spotify',
        url: 'https://embed.spotify.com/oembed/?url={{url}}'
      },
      axios: axios.create({
        adapter: createAxiosAdapter({
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
          data: JSON.stringify(data),
        }),
      }),
    });
    assert.deepStrictEqual(result, data);
  });

  it('should transform a service.url function and return the Oembed data', async () => {
    const data = {
      'version': '1.0',
      'type': 'rich',
      'html': '<iframe height="640" width="360" src="https://play.soundsgood.co/embed/5e7f4b0e623c9d075e835220?" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen allow="autoplay; encrypted-media" allowtransparency="true"></iframe>',
      'width': '640',
      'height': '360',
      'title': '80s number twos',
      'author_name': 'Talk About Pop Music',
      'author_url': 'http://talkaboutpopmusic.com',
      'provider_name': 'Soundsgood',
      'provider_url': 'https://soundsgood.co',
      'thumbnail_url': 'https://cdn-images.soundsgood.co/w_640,h_360,r_contain,q_100,ch_810,cw_1440,cy2_810,cy_0,cx2_1440,cx_0/13f1cfb9-6913-4461-a121-c65e76c39427_19156_production.jpg',
      'thumbnail_width': '640',
      'thumbnail_height': '360'
    };

    const result = await fetchData({
      url: 'https://play.soundsgood.co/playlist/number-twos-of-the-80s',
      service: {
        name: 'Soundgood',
        url: ({ url: u }) => `https://play.soundsgood.co/oembed?format=xml&url=${u}`
      },
      axios: axios.create({
        adapter: createAxiosAdapter({
          status: 200,
          headers: {
            'content-type': 'text/xml; charset=utf-8',
            etag: 'W/"3c4-joYSwRnOMyvwnsdC/E8Nww"',
          },
          data: getFixture('soundsgood-80s-2s.xml'),
        }),
      }),
    });
    assert.deepStrictEqual(result, data);
  });

  it('should fetch a raw webpage & scrape tags from opengraph tags', async () => {
    const result = await fetchData({
      url: 'https://discoverwestworld.com',
      axios: axios.create({
        adapter: createAxiosAdapter({
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
          data: getFixture('westworld-opengraph.html'),
        }),
      }),
    });
    assert.deepStrictEqual(result, {
      version: '1.0',
      type: 'link',
      title: 'Westworld',
      provider_name: 'Westworld',
      provider_url: 'https://discoverwestworld.com',
      description: 'These violent delights have violent ends',
      thumbnail_url: 'https://www.gstatic.com/tv/thumb/tvbanners/17848831/p17848831_b_v8_aa.jpg',
    });
  });

  it('should fetch a raw webpage & scrape tags from twitter tags', async () => {
    const result = await fetchData({
      url: 'https://discoverwestworld.com',
      axios: axios.create({
        adapter: createAxiosAdapter({
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
          data: getFixture('westworld-twitter.html'),
        }),
      }),
    });
    assert.deepStrictEqual(result, {
      version: '1.0',
      type: 'link',
      title: 'Westworld',
      provider_name: 'discoverwestworld.com',
      provider_url: 'https://discoverwestworld.com',
      description: 'These violent delights have violent ends',
      thumbnail_url: 'https://www.gstatic.com/tv/thumb/tvbanners/17848831/p17848831_b_v8_aa.jpg',
    });
  });

  it('should fetch a raw webpage & scrape tags from raw meta tags', async () => {
    const result = await fetchData({
      url: 'https://discoverwestworld.com',
      axios: axios.create({
        adapter: createAxiosAdapter({
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
          data: getFixture('westworld-raw.html'),
        }),
      }),
    });
    assert.deepStrictEqual(result, {
      version: '1.0',
      type: 'link',
      title: 'Westworld',
      provider_name: 'discoverwestworld.com',
      provider_url: 'https://discoverwestworld.com',
      description: 'These violent delights have violent ends',
    });
  });

  it('should fetch a raw webpage & scrape tags from many tags', async () => {
    const result = await fetchData({
      url: 'https://discoverwestworld.com',
      axios: axios.create({
        adapter: createAxiosAdapter({
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
          data: getFixture('westworld-many.html'),
        }),
      }),
    });
    assert.deepStrictEqual(result, {
      version: '1.0',
      type: 'link',
      title: 'Westworld',
      provider_name: 'Westworld',
      provider_url: 'https://discoverwestworld.com',
      description: 'These violent delights have violent ends',
      thumbnail_url: 'https://www.gstatic.com/tv/thumb/tvbanners/17848831/p17848831_b_v8_aa.jpg',
    });
  });

});
