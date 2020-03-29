<h1 align="center">yoem</h1>

[![NPM](https://badge.fury.io/js/yoem.svg)](https://www.npmjs.com/package/yoem)
[![CI](https://github.com/someimportantcompany/yoem/workflows/tests/badge.svg)](https://github.com/someimportantcompany/yoem/actions)
[![Coveralls](https://coveralls.io/repos/github/someimportantcompany/yoem/badge.svg?branch=master)](https://coveralls.io/github/someimportantcompany/yoem?branch=master)

Unopinionated self-hosted [oembed](https://oembed.com) URL expansion. Drop into your existing [Node.js](https://nodejs.org) application or fire up an independent [Serverless](https://serverless.com) microservice.

---

This library can be used to expand URLs according to the [Oembed](https://oembed.com) specification, either by using a service's official oembed endpoint or by using the available tags on the webpage.

This is an open-source re-implementation of [Car Throttle](https://www.carthrottle.com/)'s embed service, which handles link-expansion in various points of the platform, most commonly in [link posts like this](https://www.carthrottle.com/post/nrmexpm/) and [video posts like this](https://www.carthrottle.com/post/wbz7k3k/).

Not to be mistaken for [wrender](https://npm.im/wrender), an open-source re-implementation of Car Throttle's image delivery service.

There are three distinct recommended use-cases. The first is part of a larger Node.js application, drop this into your existing [Express.js](https://expressjs.com) / [Koa.js](https://koajs.com) / other framework. The second is as a dedicated microservice, run independently / containerised / serverless. The third is programatically, fetching embeds as-and-when.

```http
GET /embed?url=https://www.youtube.com/watch?v=0jNvJU52LvU HTTP/1.1
Accept: */*
Accept-Encoding: gzip, deflate
Connection: keep-alive
Host: localhost:3000
User-Agent: HTTPie/1.0.2
```
```http
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 682
Content-Type: application/json; charset=utf-8
Date: Sun, 29 Mar 2020 14:29:30 GMT
X-Yoem-Response-Time: 100ms
X-Yoem-Service: youtube
```
```json
{
  "embed": {
    "type": "video",
    "version": "1.0",
    "title": "Marvel Studios’ Avengers: Endgame | “To the End”",
    "thumbnail_height": 360,
    "author_name": "Marvel Entertainment",
    "height": 270,
    "provider_url": "https://www.youtube.com/",
    "provider_name": "YouTube",
    "html": "<iframe width=\"480\" height=\"270\" src=\"https://www.youtube.com/embed/0jNvJU52LvU?feature=oembed\" frameborder=\"0\" allow=\"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>",
    "thumbnail_width": 480,
    "thumbnail_url": "https://i.ytimg.com/vi/0jNvJU52LvU/hqdefault.jpg",
    "width": 480,
    "author_url": "https://www.youtube.com/user/MARVEL"
  }
}
```

## Installation

```sh
$ npm install --save yoem
```

## Usage

- [Options](#options)
- Frameworks
  - [Express](#express)
  - [Koa](#koa)
  - [Micro](#micro)
  - [Zeit Now](#zeit-now)
  - [Adonis](#adonis)
- Serverless
  - [AWS Lambda](#aws-lambda)
  - [AWS API Gateway](#aws-api-gateway)
  - [AWS Application Load Balancer](#aws-application-load-balancer)
  - [Azure HTTP Function](#azure-http-function)
  - [Google Cloud Function](#google-cloud-function)
- [Programatically](#programatically)
- [Custom Embeds](#custom-services)

### Options

```js
const yoem = require('yoem');

const options = {

  services: {
    // You can specify a fixed list of services that you wish to support,
    // Either from the list of pre-defined ones or by specifying your own:
    facebookPost: yoem.service.facebookPost,
    facebookVideo: yoem.service.facebookVideo,
    twitter: yoem.service.twitter,
    youtube: yoem.service.youtube,
    spotify: yoem.service.spotify,
    imgur: yoem.service.imgur,

    // Realistically you'll want to use the default collection of services
    ...yoem.services,
    // And include some of your own
    someimportantcompany: {
      name: 'SomeImportantService',
      matches: [ 'someimportantcompany.com/**' ],
      // See below for detailed examples of writing your own services:
      url: 'https://someimportantcompany.com/oembed.json?url={{url}}'
    },
  },

  // Specify a timeout, uses the ms syntax
  timeout: '30s',

  // Add a blacklist of URLs to reject
  blacklist: [ '*.wikia.com/**' ],
  // Or specify a whitelist of URLs if that's preferred
  whitelist: [ '**facebook.com/**', '**twitter.com/**', '**instagram.com/**' ],

  // Override the default fallback fetch function
  async fallback(opts) {
    // `opts.url` => The URL being expanded
    // `opts.timeout` => The timeout key above
    // `opts.blacklist` => The blacklist array above
    // `opts.whitelist` => The whitelist array above
    // ... => And the rest of the properties are passed into yoem({ ... })
    //
    // Should return the embed object
  },

};
```

- [micromatch](https://npm.im/micromatch) syntax is used to find an appropriate service, or detect blacklisted/whitelisted URLs.

### Express

> [Express](https://expressjs.com): Fast, unopinionated, minimalist web framework for Node.js

```js
const express = require('express');
const yoem = require('yoem');

const app = express();

app.get('/embed', yoem.express({
  // See the Options documentation above
}));

app.listen(3000, () => console.log('Listening on http://localhost:3000/'));
```

### Koa

> [Koa](https://koajs.com/): Next generation web framework for Node.js

```js
const Koa = require('koa');
const yoem = require('yoem');

const app = new Koa();

app.get('/embed', yoem.koa({
  // See the Options documentation above
}));

app.listen(3000, () => console.log('Listening on http://localhost:3000/'));
```

### Micro

> [micro](https://github.com/zeit/micro): Asynchronous HTTP microservices

```js
const yoem = require('yoem');

module.exports = yoem.micro({
  // See the Options documentation above
});
```

### Zeit Now

> [ZEIT Now](https://zeit.co/docs): A cloud platform for Serverless Functions.

```js
const yoem = require('yoem');

module.exports = yoem.zeit({
  // See the Options documentation above
}));
```

### Adonis

> [AdonisJs](https://adonisjs.com/docs/4.1/routing): Alternative Node.js web framework

```js
// start/routes.js
const yoem = require('yoem');

Route.get('/embed', yoem.adonis({
  // See the Options documentation above
}));
```

### AWS Lambda

- Assuming the [Serverless](https://serverless.com) framework

```yml
provider:
  name: aws
  runtime: nodejs10.x
functions:
  embed:
    handler: yoem.awsLambda
```

### AWS API Gateway

- Assuming the [Serverless](https://serverless.com) framework

```yml
provider:
  name: aws
  runtime: nodejs10.x
functions:
  embed:
    handler: yoem.awsApiGateway
    events:
      - http: GET /embed
```

### AWS Application Load Balancer

- Assuming the [Serverless](https://serverless.com) framework

```yml
provider:
  name: aws
  runtime: nodejs10.x
functions:
  embed:
    handler: yoem.awsApplicationLoadBalancer
    events:
      - alb:
          listenerArn: arn:aws:elasticloadbalancing:...
          priority: 1
          conditions:
            method: GET
            path: /embed
```

### Azure HTTP Function

- Assuming the [Serverless](https://serverless.com) framework

```yml
provider:
  name: azure
  location: UK South
functions:
  embed:
    handler: yoem.azureHttp
    events:
      - http: true
        x-azure-settings:
          name: req
          methods:
            - GET
          route: embed
          authLevel: anonymous
```

### Google Cloud Function

- Assuming the [Serverless](https://serverless.com) framework

```yml
provider:
  name: google
functions:
  embed:
    handler: yoem.googleCloudFunction
    events:
      - http: embed
```

### Programatically

- Assuming the [Serverless](https://serverless.com) framework
- And assuming you want to add custom services in a Serverless environment

```yml
provider:
  name: aws
  runtime: nodejs10.x
functions:
  embed:
    handler: handler.embed
```
```js
const assert = require('assert');
const yoem = require('yoem');

module.exports.embed = function embed(event, context, callback) {
  try {
    const { url } = event || {};
    assert(typeof url === 'string', 'Missing URL from event');

    const result = await yoem({
      url,
      services: {
        // Include the default list of services
        ...yoem.services,
        // And your own custom one
        someimportantcompany: {
          name: 'SomeImportantService',
          matches: [ 'someimportantcompany.com/**' ],
          url: 'https://someimportantcompany.com/oembed.json?url={{url}}'
        },
      },
    });

    callback(null, result);
  } catch (err) {
    callback(err);
  }
};
```

### Custom Embeds

Each service is made up of the following properties:

- **name**: The service name.
- **matches**: An array of URLs to match against the service.
- **get**: A function to return the embed data for the service.
- **url**: A function, or string, to drop the incoming URL in & fetch the embed data back from the service.

```js
{
  someimportantcompany: {
    name: 'SomeImportantService',
    matches: [ 'someimportantcompany.com/**' ],

    // `url` can be a string with the placeholder
    url: 'https://someimportantcompany.com/oembed.json?url={{url}}'

    // Or a function that returns the URL to hit:
    url: ({ url }) => `https://someimportantcompany.com/oemned.json?url=${url}&time=${Date.now()}`,
  },
}
```

- Either **get** or **url** is required. If both are passed **get** will take priority.
- With **url**:
  - The [fetchData](./src/fetchData.js) function will insert your URL into the `{{url}}` placeholder, and an error will be thrown if `service.url` does not contain this placeholder.
  - If the URL returns a HTTP 3XX redirect status, the `service.url` **will not be considered** when following redirects.
- With **get**:
  - This (likely async) function takes the same arguments as [the fallback option](#options), and should return the embed data for this URL. If this is your service ensure it responds in under 30s as a lot of serverless APIs (including API-Gateway) enforce a 30s timeout.

```js
{
  someimportantcompany: {
    name: 'SomeImportantService',
    matches: [ 'someimportantcompany.com/**' ],

    // This could be as simple as a static return value
    get() {
      return {
        version: '1.0',
        type: 'link',
        title: 'Some Important Title'
        provider_name: 'Some Important Company',
        provider_url: 'https://someimportantcompany.com',
        description: 'Cupcake ipsum dolor. Sit amet pie caramels soufflé cupcake.',
        thumbnail_url: 'https://avatars3.githubusercontent.com/u/16253596?s=200&v=4',
        thumbnail_height: '200',
        thumbnail_width: '200',
      };
    },

    // A function that returns a promise
    async get({ url }) {
      return axios.get('https://someimportantcompany.com/oembed.json', {
        maxRedirects: 0,
        params: { url },
        responseType: 'json',
        validateStatus: s => s === 200,
      }).then(({ data }) => data);
    },

    // Or an async function
    async get({ url }) {
      const { data } = await axios.get('https://someimportantcompany.com/oembed.json', {
        maxRedirects: 0,
        params: { url },
        responseType: 'json',
        validateStatus: s => s === 200,
      });

      return data;
    },
  },
}
```

## Release Notes

- **2.0.0:** Rewrite release, including support for all other use-cases.
- **1.0.0:** Initial release, including Express support only.
