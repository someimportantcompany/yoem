const xml2js = require('xml2js');

module.exports = {

  json: {
    contentTypes: [
      'application/json**',
    ],
    // Axios has automatic transforms for JSON!
    parse: body => body,
  },

  xml: {
    contentTypes: [
      'text/xml**',
    ],
    async parse(body) {
      let result = await xml2js.parseStringPromise(body, { explicitArray: false });

      if (result) {
        var result_keys = Object.keys(result);

        // Remove the top-level tag
        if (result_keys.length === 1) {
          result = result[result_keys[0]];
          result_keys = Object.keys(result);
        }

        var k = null;

        // Turn hyphens in keys to underscores, to ease JSON output
        for (k in result) {
          if (result.hasOwnProperty(k) && k.match('-')) {
            result[k.replace('-', '_')] = result[k];
            delete result[k];
          }
        }

        // Fix a strange bug regarding raw data output in XML
        if (result[result_keys[0]].hasOwnProperty('$')) {
          for (k in result) {
            if (result.hasOwnProperty(k) && typeof result[k] === 'object') {
              result[k] = result[k]._;
            }
          }
        }
      }

      return result;
    },
  },

};
