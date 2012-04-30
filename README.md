# apiserver-router [![build status](https://secure.travis-ci.org/kilianc/node-apiserver-router.png?branch=master)](http://travis-ci.org/kilianc/node-apiserver-router)

A fast API router with integrated caching system bundled with [ApiServer](https://github.com/kilianc/node-apiserver)

## Installation

    ⚡ npm install apiserver-router

```javascript
var Router = require('apiserver-router')
```

## Example

```javascript
var UserModule = function (options) {
  this.options = options
}

// will be translated into /1/random_photo_module/create_album
UserModule.prototype.createAlbum = function (request, response) { ... }

// will be translated into /1/random_photo_module/upload_photo
UserModule.prototype.uploadPhoto = function (request, response) { ... }

// private method, skipped
UserModule.prototype._checkFileExtension = function (request, response) { ... }

```

```javascript
router.update({ '1': { randomPhotoModule: UserModule } })
router.get('/1/random_photo_module/upload_photo') // returns the associated chain
```

## Class Method: constructor

### Syntax:

```javascript
new Router()
```

## Class Method: update

Builds and caches the routes. You must call it every time a middleware or a module changes.

### Syntax:

```javascript
Router.prototype.update(modules[, middlewareList])
```

### Arguments:

* __modules__ - (`Object`) an hashtable of [API modules](https://github.com/kilianc/node-apiserver/tree/master#modules)
* __middlewareList__ - (`Array`) a list of [middleware](https://github.com/kilianc/node-apiserver/tree/master#middleware)

### Example:

```javascript
...
var router = new Router()
router.update({
  v1: {
    user: {
      signin: function (request, response) { /* function body */ },
      signout: function (request, response) { /* function body */ },
      signup: function (request, response) { /* function body */ }
    }
  }
}, [
  { route: /signup/, handle: randomMiddleware1 },
  { route: /sign/, handle: randomMiddleware2 }
])
...
```

## Class Method: get

This method returns a list of functions that will be executed with [fnchain](https://github.com/kilianc/node-fnchain). The list will contain all the middleware active for the API endpoint reached by `pathname` and as last ring of the chain the API method to execute.

### Syntax:

```javascript
Router.prototype.get(pathname)
```

### Arguments:

* __pathname__ - (`String`)

### Example:

```javascript
...
router.get('/v1/users/signup')
...
```

# How to contribute

This repository follows (more or less) the [Felix's Node.js Style Guide](http://nodeguide.com/style.html), your contribution must be consistent with this style.

The test suite is written on top of [visionmedia/mocha](http://visionmedia.github.com/mocha/) and it took hours of hard work. Please use the tests to check if your contribution breaks some part of the library and add new tests for each new feature.

    ⚡ npm test

and for your test coverage

    ⚡ make test-cov

## License

_This software is released under the MIT license cited below_.

    Copyright (c) 2010 Kilian Ciuffolo, me@nailik.org. All Rights Reserved.

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the 'Software'), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
