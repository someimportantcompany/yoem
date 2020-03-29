require('module-alias/register');
require('module-alias').addAlias('@src', require('path').resolve(__dirname, '../src'));
require('module-alias').addAlias('@test', __dirname);
