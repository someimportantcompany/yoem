const defaultFetchData = require('./src/fetchData');
const defaultServices = require('./src/services');
const yoem = require('./src/yoem');

module.exports = yoem;
module.exports.fetchData = defaultFetchData;
module.exports.services = defaultServices;

async function integration(opts) {
  try {
    const { embed, serviceName, timeTaken } = await yoem(opts);
    return {
      status: 200,
      statusMessage: '200 OK',
      headers: {
        'X-Yoem-Response-Time': timeTaken,
        'X-Yoem-Service': serviceName,
      },
      body: {
        embed,
      },
    };
  } catch (err) {
    return {
      status: err.status || 500,
      statusMessage: err.status && err.statusMessage ? err.statusMessage : 'Internal Server Error',
      headers: {},
      body: {
        error: {
          code: err.code || null,
          message: err.message || `${err}`,
          name: err.name || 'Error',
          serviceName: err.serviceName || null,
          status: err.status || 500,
          stack: process.env.NODE_ENV === 'production' ? undefined : err.stack.split('\n').map(s => `${s}`.trim()),
          url: err.url || null,
        },
      },
    };
  }
}

/**
 * FRAMEWORKS
 */

/**
 * An Express route
 * @link https://adonisjs.com/docs/4.1/routing
 */
module.exports.adonis = function adonis(opts) {
  return async ({ request, response }) => {
    const { status, headers, body } = await integration({
      ...(opts || {}),
      url: (request.get() || {}).url,
      headers: request.headers() || {},
    });

    response.status(status);
    for (const key in headers) {
      if (headers.hasOwnProperty(key)) {
        response.header(key, headers[key]);
      }
    }
    response.json(body);
  };
};

/**
 * An Express route
 * @link http://expressjs.com/en/4x/api.html
 */
module.exports.express = function express(opts) {
  return async (req, res) => {
    const { status, headers, body } = await integration({
      ...(opts || {}),
      url: ((req || {}).query || {}).url,
      headers: (req || {}).headers || {},
    });

    res.status(status);
    res.set(headers);
    res.json(body);
  };
};

/**
 * A Koa route
 * @link https://koajs.com/
 */
module.exports.koa = function koa(opts) {
  return async ctx => {
    const { status, headers, body } = await integration({
      ...(opts || {}),
      url: ((ctx || {}).query || {}).url,
      headers: (ctx || {}).headers || {},
    });

    ctx.status = status;
    ctx.set({
      'Content-Type': 'application/json',
      ...headers,
    });
    ctx.body = JSON.stringify(body);
  };
};

/**
 * A Micro route
 * @link https://github.com/zeit/micro
 */
module.exports.micro = function micro(opts) {
  // eslint-disable-next-line global-require
  const url = require('url');

  return async req => {
    const { query } = url.parse(req.url, { parseQueryString: true });
    const { embed } = await yoem({
      ...(opts || {}),
      url: query.url,
      headers: (req || {}).headers || {},
    });
    return { embed };
  };
};

/**
 * A Zeit route
 * @link https://zeit.co/docs/runtimes#official-runtimes/node-js/node-js-request-and-response-objects
 */
module.exports.zeit = function zeit(opts) {
  return async (req, res) => {
    const { status, headers, body } = await integration({
      ...(opts || {}),
      url: (req.query || {}).url,
      headers: (req || {}).headers || {},
    });

    res.status(status);
    for (const key in headers) {
      if (headers.hasOwnProperty(key)) {
        res.setHeader(key, headers[key]);
      }
    }
    res.json(body);
  };
};

/**
 * SERVERLESS
 */

/**
 * A native Lambda function, invoked through/by AWS, usually synchronous as you want the output
 * @link https://docs.aws.amazon.com/lambda/latest/dg/invocation-sync.html
 */
module.exports.awsLambda = async (event, context, callback) => {
  try {
    const result = await yoem({
      url: (event || {}).url,
      headers: (event || {}).headers || {},
    });

    callback(null, result);
  } catch (err) {
    callback(err);
  }
};

/**
 * A Lambda function invoked through an AWS API Gateway
 * (This assumes the default Lambda Proxy Integration)
 * @link https://serverless.com/framework/docs/providers/aws/events/apigateway/#lambda-proxy-integration
 */
module.exports.awsApiGateway = async (event, context, callback) => {
  const { status, headers, body } = await integration({
    url: ((event || {}).queryStringParameters || {}).url,
    headers: (event || {}).headers || {},
  });
  callback(null, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
};

/**
 * A Lambda function invoked through an AWS Application Load Balancer
 * @link https://docs.aws.amazon.com/lambda/latest/dg/services-alb.html
 */
module.exports.awsApplicationLoadBalancer = async (event, context, callback) => {
  const { status: statusCode, statusMessage, headers, body } = await integration({
    url: ((event || {}).queryStringParameters || {}).url,
    headers: (event || {}).headers || {},
  });
  callback(null, {
    statusCode,
    statusMessage,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    isBase64Encoded: false,
    body: JSON.stringify(body),
  });
};

/**
 * An Azure function invoked through an API endpoint
 * @link https://serverless.com/framework/docs/providers/azure/events/http/
 */
module.exports.azureHttp = async (context, req) => {
  const { status, headers, body } = await integration({
    url: ((req || {}).query || {}).url,
    headers: (req || {}).headers || {},
  });
  context.res = {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  };
  context.done();
};

/**
 * An Azure function invoked through an API endpoint
 * @link https://serverless.com/framework/docs/providers/azure/events/http/
 */
module.exports.googleCloudFunction = async (req, res) => {
  const { status, headers, body } = await integration({
    url: ((req || {}).query || {}).url,
    headers: (req || {}).headers || {},
  });

  res.status(status);
  res.set(headers);
  res.json(body);
};
