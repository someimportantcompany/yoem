const assert = require('assert');
const nock = require('nock');
const sinon = require('sinon');
const yoem = require('@src/../');

const url = 'https://twitter.com/jdrydn/status/1122210761110114304';
nock('https://publish.twitter.com/')
  .persist()
  .get('/oembed')
  .query(true)
  .reply(200, {
    'url': 'https://twitter.com/jdrydn/status/1122210761110114304',
    'author_name': 'James ☁️',
    'author_url': 'https://twitter.com/jdrydn',
    'width': 550,
    'height': null,
    'type': 'rich',
    'cache_age': '3153600000',
    'provider_name': 'Twitter',
    'provider_url': 'https://twitter.com',
    'version': '1.0'
  });

describe('src/integrations', () => {

  it('should export a function', () => assert.strictEqual(typeof yoem, 'function'));

  it('should wrap an Adonis route', async () => {
    const request = {
      get: sinon.fake.returns({ url }),
      headers: sinon.fake(),
    };
    const response = {
      status: sinon.fake(),
      header: sinon.fake(),
      json: sinon.fake(),
    };

    const route = yoem.adonis();
    await route({ request, response });

    assert(response.status.calledOnce);
    assert.strictEqual(response.status.firstArg, 200);
    assert(response.header.called);
    assert(response.json.calledOnce);
    assert(response.json.firstArg.hasOwnProperty('embed'));
  });

  it('should wrap an Express route', async () => {
    const req = {
      query: {
        url,
      },
    };
    const res = {
      status: sinon.fake(),
      set: sinon.fake(),
      json: sinon.fake(),
    };

    const route = yoem.express();
    await route(req, res);

    assert(res.status.calledOnce);
    assert.strictEqual(res.status.firstArg, 200);
    assert(res.set.calledOnce);
    assert(res.json.calledOnce);
    assert(res.json.firstArg.hasOwnProperty('embed'));
  });

  it('should wrap an Koa route', async () => {
    const ctx = {
      headers: null,
      query: {
        url,
      },
      status: null,
      set: sinon.fake(),
      body: null,
    };

    const route = yoem.koa();
    await route(ctx);

    assert.strictEqual(ctx.status, 200);
    assert(ctx.set.calledOnce);
    assert(JSON.parse(ctx.body).hasOwnProperty('embed'));
  });

  it('should wrap an Micro route', async () => {
    const req = {
      headers: null,
      url: `/oembed?url=${url}`,
    };

    const route = yoem.micro();
    const body = await route(req);
    assert(body.hasOwnProperty('embed'));
  });

  it('should wrap an Zeit route', async () => {
    const req = {
      query: {
        url,
      },
    };
    const res = {
      status: sinon.fake(),
      setHeader: sinon.fake(),
      json: sinon.fake(),
    };

    const route = yoem.zeit();
    await route(req, res);

    assert(res.status.calledOnce);
    assert.strictEqual(res.status.firstArg, 200);
    assert(res.setHeader.called);
    assert(res.json.calledOnce);
    assert(res.json.firstArg.hasOwnProperty('embed'));
  });

  it('should handle an AWS Lambda invocation', async () => {
    const callback = sinon.fake();
    await yoem.awsLambda({ url }, {}, callback);
    assert(callback.calledOnce);
    assert(callback.lastArg.hasOwnProperty('embed'));
  });

  it('should handle an AWS API-Gateway Lambda invocation', async () => {
    const callback = sinon.fake();
    await yoem.awsApiGateway({ queryStringParameters: { url } }, {}, callback);
    assert(callback.calledOnce);
    assert(callback.lastArg.hasOwnProperty('status'));
    assert.strictEqual(callback.lastArg.status, 200);
    assert(JSON.parse(callback.lastArg.body).hasOwnProperty('embed'));
  });

  it('should handle an AWS Application Load Balancer Lambda invocation', async () => {
    const callback = sinon.fake();
    await yoem.awsApplicationLoadBalancer({ queryStringParameters: { url } }, {}, callback);
    assert(callback.calledOnce);
    assert(callback.lastArg.hasOwnProperty('statusCode'));
    assert.strictEqual(callback.lastArg.statusCode, 200);
    assert(callback.lastArg.hasOwnProperty('statusMessage'));
    assert.strictEqual(callback.lastArg.statusMessage, '200 OK');
    assert(callback.lastArg.hasOwnProperty('isBase64Encoded'));
    assert.strictEqual(callback.lastArg.isBase64Encoded, false);
    assert(JSON.parse(callback.lastArg.body).hasOwnProperty('embed'));
  });

  it('should handle an Azure HTTP Function invocation', async () => {
    const context = {
      res: null,
      done: sinon.fake(),
    };
    const req = {
      query: { url },
    };

    await yoem.azureHttp(context, req);
    assert(context.done.calledOnce);
    assert(context.res && context.res.status, 'Expected res.status to be set');
    assert.strictEqual(context.res.status, 200);
    assert(context.res.headers, 'Expected res.headers to be set');
    assert(JSON.parse(context.res.body).hasOwnProperty('embed'));
  });

  it('should handle a Google Cloud Function invocation', async () => {
    const req = {
      query: {
        url,
      },
    };
    const res = {
      status: sinon.fake(),
      set: sinon.fake(),
      json: sinon.fake(),
    };

    await yoem.googleCloudFunction(req, res);

    assert(res.status.calledOnce);
    assert.strictEqual(res.status.firstArg, 200);
    assert(res.set.calledOnce);
    assert(res.json.calledOnce);
    assert(res.json.firstArg.hasOwnProperty('embed'));
  });

});
