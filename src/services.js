const services = module.exports = require('./oembed.json');

services.facebookPost = {
  name: 'Facebook-Post',
  matches: (({ domains: ds, paths: ps }) => ps.reduce((l, p) => l.concat(ds.map(d => `${d}${p}`)), []))({
  domains: [
      'facebook.com',
      'm.facebook.com'
    ],
    paths: [
      '/*/posts/**',
      '/*/activity/**',
      '/photo.php?fbid=**',
      '/photos/**',
      '/permalink.php?story_fbid=**',
      '/media/set?set=**',
      '/questions/**',
      '/notes/*/*/**',
    ],
  }),
  url: 'https://www.facebook.com/plugins/post/oembed.json/?url={{url}}',
};

services.facebookVideo = {
  name: 'Facebook-Video',
  matches: (({ domains: ds, paths: ps }) => ps.reduce((l, p) => l.concat(ds.map(d => `${d}${p}`)), []))({
  domains: [
      'facebook.com',
      'm.facebook.com'
    ],
    paths: [
      '/*/videos/**',
      '/video.php?id=**',
      '/video.php?v=**',
    ],
  }),
  url: 'https://www.facebook.com/plugins/video/oembed.json/?url={{url}}',
};

services.twitter = {
  name: 'Twitter',
  matches: [ 'twitter.com/*/status/*', 'm.twitter.com/*/status/*' ],
  url: 'https://publish.twitter.com/oembed?url={{url}}',
};

services.youtube = {
  name: 'YouTube',
  matches: [ 'youtu.be/*', 'youtube.com/*', 'm.youtube.com/*' ],
  url: 'https://www.youtube.com/oembed?url={{url}}&format=json',
};

services.spotify = {
  name: 'Spotify',
  matches: [ 'embed.spotify.com/*', 'open.spotify.com/*' ],
  url: 'https://embed.spotify.com/oembed/?url={{url}}',
};

services.imgur = {
  name: 'Imgur',
  matches: [ 'imgur.com/*', 'i.imgur.com/*' ],
  url: 'https://api.imgur.com/oembed.json?url={{url}}',
};
