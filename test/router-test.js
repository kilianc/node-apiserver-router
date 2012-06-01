var should = require('should'),
    Router = require('../'),
    XRegExp = require('xregexp').XRegExp,
    objectModule = require('./fixtures/router-module'),
    classModule = require('./fixtures/router-module-class')

var router
var fakeMiddlewares = generateFakeMiddlewares()

describe('Router', function () {
  describe('#()', function () {
    it('should store options', function () {
      router = new Router({
        defaultRoute: 'defaultRoute',
        foo: 'foo',
        bar: 'bar'
      })
      router.defaultRoute.should.eql('defaultRoute')
      router.foo.should.eql('foo')
      router.bar.should.eql('bar')
    })
    it('should use defaults for defaultRoute', function () {
      router = new Router()
      router.defaultRoute.should.eql('/:version/:module/:method')
    })
  })
  describe('#update()', function () {
    it('should create routes / object', function () {
      router = new Router()
      router.update({ v1: { test: objectModule } })
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/am_a_public_api')
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/foo_api')
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/post')
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/wrong_case_api')
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/a_a')
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/photo')
      checkHttpMethods(router.defaultRoutes['/v1/test/am_a_public_api'])
      checkHttpMethods(router.defaultRoutes['/v1/test/foo_api'])
      checkHttpMethods(router.defaultRoutes['/v1/test/post'])
      checkHttpMethods(router.defaultRoutes['/v1/test/wrong_case_api'])
      checkHttpMethods(router.defaultRoutes['/v1/test/a_a'])
      checkHttpMethods(router.defaultRoutes['/v1/test/photo'], ['get', 'post'])
    })
    it('should create routes / class', function () {
      router = new Router()
      router.update({ v1: { test: new classModule() } })
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/am_a_public_api')
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/foo_api')
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/post')
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/wrong_case_api')
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/a_a')
      new should.Assertion(router.defaultRoutes).have.property('/v1/test/photo')
      checkHttpMethods(router.defaultRoutes['/v1/test/am_a_public_api'])
      checkHttpMethods(router.defaultRoutes['/v1/test/foo_api'])
      checkHttpMethods(router.defaultRoutes['/v1/test/post'])
      checkHttpMethods(router.defaultRoutes['/v1/test/wrong_case_api'])
      checkHttpMethods(router.defaultRoutes['/v1/test/a_a'])
      checkHttpMethods(router.defaultRoutes['/v1/test/photo'], ['get', 'post'])
    })
    it('should skip private methods', function () {
      router = new Router()
      router.update({ v1: { test: objectModule } })
      new should.Assertion(router.defaultRoutes).not.have.key('/v1/test/_private_method')
    })
    it('should skip non endpoints', function () {
      router = new Router()
      router.update({ v1: { test: objectModule } })
      new should.Assertion(router.defaultRoutes).not.have.key('/v1/test/database')
    })
    ;[
      ['apiName', 'api_name'],
      ['apiLongName', 'api_long_name'],
      ['AA', 'a_a']
    ].forEach(function (names) {
      var conflictsModule = { v1: { test: {} } }
      conflictsModule.v1.test[names[0]] = new Function()
      conflictsModule.v1.test[names[1]] = new Function()
      it('should throw error on ambiguous modules [' + names[0] + ', ' + names[1] + ']', function () {
        router.update.bind(router, conflictsModule).should.throw(/^Routing conflict /)
      })
    })
  })
  describe('#addRoute()', function () {
    it('should throw error if the endpoint is not found', function () {
      router = new Router()
      router.update({ 1: { test: objectModule } })
      ;[
        '1/typo#post',
        '1/test#typo',
        'typo/test#post'
      ].forEach(function (route) {
        router.addRoute.bind(router, '/test_module/:id/:verbose', route).should.throw(/^Can not resolve endopoint/)
      })
    })
    it('should accept a XRegExp', function () {
      router = new Router()
      router.update({ 1: { test: objectModule } })
      router.addRoute(XRegExp('/post/(?<message>[\\w]+)'), '1/test#post')
    })
    it('should throw error if the route is not a String or a XRegExp', function () {
      router = new Router()
      router.update({ 1: { test: objectModule } })
      ;[
        /^/,
        {},
        false
      ].forEach(function (route) {
        router.addRoute.bind(router, route, '1/test#post').should.throw(/^Route must be a String or a XRegExp/)
      })
    })
    it('should store a custom route', function () {
      router = new Router()
      router.update({ 1: { test: objectModule } })
      router.addRoute('/test_module/:id/:verbose', '1/test#post')
      router.customRoutes.should.have.length(1)
      router.customRoutes[0].should.have.keys(['xRegExp', 'endpoint', 'defaults'])
      new should.Assertion(router.customRoutes[0].defaults).eql({})
      new should.Assertion(router.disabledDefaultRoutes).eql({ '/1/test/post': true })
    })
    it('should store a custom route with default params', function () {
      var defaults = { foo: false, bar: 'foo' }
      router = new Router()
      router.update({ 1: { test: objectModule } })
      router.addRoute('/test_module/:id/:verbose', '1/test#post', defaults)
      router.customRoutes[0].defaults.should.equal(defaults)
    })
    it('should store a custom route with custom defaultRoute', function () {
      router = new Router({ defaultRoute: '/:module/:method/:version' })
      router.update({ 1: { test: objectModule } })
      router.addRoute('/test_module/:id/:verbose', '1/test#post')
      new should.Assertion(router.disabledDefaultRoutes).eql({ '/test/post/1': true })
    })
    it('should store a custom route and keep the default one', function () {
      router = new Router({ defaultRoute: '/:module/:method/:version' })
      router.update({ 1: { test: objectModule } })
      router.addRoute('/test_module/:id/:verbose', '1/test#post', null, true)
      new should.Assertion(router.disabledDefaultRoutes).eql({})
    })
  })
  describe('#getDefault()', function () {
    it('should return the functions chain', function () {
      router = new Router()
      router.update({ 1: { test: objectModule } }, [
        { route: /.+/, handle: fakeMiddlewares[0] },
        { route: /\/am_a/, handle: fakeMiddlewares[1] },
        { route: /api$/, handle: fakeMiddlewares[2] },
        { route: /foo/, handle: fakeMiddlewares[3] },
        { route: /\/1\/test\/post/, handle: fakeMiddlewares[4] },
        { route: /\/1\/test\/.+o.+/, handle: fakeMiddlewares[5] }
      ])
      checkChain(router, '/1/test/am_a_public_api', [fakeMiddlewares[0], fakeMiddlewares[1], fakeMiddlewares[2]], 'amAPublicApi')
      checkChain(router, '/1/test/foo_api', [fakeMiddlewares[0], fakeMiddlewares[2], fakeMiddlewares[3], fakeMiddlewares[5]], 'fooApi')
      checkChain(router, '/1/test/post', [fakeMiddlewares[0], fakeMiddlewares[4], fakeMiddlewares[5]], 'post')
      checkChain(router, '/1/test/wrong_case_api', [fakeMiddlewares[0], fakeMiddlewares[2], fakeMiddlewares[5]], 'wrong_case_api')
      checkChain(router, '/1/test/photo', [fakeMiddlewares[0], fakeMiddlewares[5]], 'photo', ['GET', 'POST'])
    })
    it('should return the functions chain / custom defaultRoute', function () {
      router = new Router({ defaultRoute: '/:module/api/:version/:method' })
      router.update({ 1: { test: objectModule } }, [
        { route: /.+/, handle: fakeMiddlewares[0] },
        { route: /\/am_a/, handle: fakeMiddlewares[1] },
        { route: /api$/, handle: fakeMiddlewares[2] },
        { route: /foo/, handle: fakeMiddlewares[3] },
        { route: /\/test\/api\/1\/post/, handle: fakeMiddlewares[4] },
        { route: /\/test\/api\/1\/.+o.+/, handle: fakeMiddlewares[5] }
      ])
      checkChain(router, '/test/api/1/am_a_public_api', [fakeMiddlewares[0], fakeMiddlewares[1], fakeMiddlewares[2]], 'amAPublicApi')
      checkChain(router, '/test/api/1/foo_api', [fakeMiddlewares[0], fakeMiddlewares[2], fakeMiddlewares[3], fakeMiddlewares[5]], 'fooApi')
      checkChain(router, '/test/api/1/post', [fakeMiddlewares[0], fakeMiddlewares[4], fakeMiddlewares[5]], 'post')
      checkChain(router, '/test/api/1/wrong_case_api', [fakeMiddlewares[0], fakeMiddlewares[2], fakeMiddlewares[5]], 'wrong_case_api')
      checkChain(router, '/test/api/1/photo', [fakeMiddlewares[0], fakeMiddlewares[5]], 'photo', ['get', 'post'])
    })
  })
  describe('#getCustom()', function () {
    it('should return the functions chain', function () {
      router = new Router()
      router.update({ 1: { test: objectModule } }, [
        { route: /.+/, handle: fakeMiddlewares[0] },
        { route: /^\/post/, handle: fakeMiddlewares[1] },
        { route: /st/, handle: fakeMiddlewares[2] },
        { route: /^\/p/, handle: fakeMiddlewares[3] }
      ])
      router.addRoute('/post/:param1/:param2', '1/test#post')
      router.addRoute('/test_module/:param1/:param2', '1/test#post')
      router.addRoute(XRegExp('^/p$'), '1/test#post')
      checkChain(router, '/post', [fakeMiddlewares[0], fakeMiddlewares[1], fakeMiddlewares[2], fakeMiddlewares[3]], 'post')
      checkChain(router, '/test_module', [fakeMiddlewares[0], fakeMiddlewares[2]], 'post')
      checkChain(router, '/p', [fakeMiddlewares[0], fakeMiddlewares[3]], 'post')
    })
    it('should parse route parameters', function () {
      router = new Router()
      router.update({ 1: { test: objectModule } })
      router.addRoute('/post/:param1/:param2', '1/test#post')
      router.addRoute('/test_module/:param1/:param2', '1/test#post')
      router.addRoute(XRegExp('^/p/(?<message>[\\w!]+)$'), '1/test#post')
      ;[
        ['/post', {}],
        ['/post/foo', { param1: 'foo' }],
        ['/post/foo/bar', { param1: 'foo', param2: 'bar' }],
        ['/test_module', {}],
        ['/test_module/', {}],
        ['/test_module//', {}],
        ['/test_module/foo', { param1: 'foo' }],
        ['/test_module/foo/', { param1: 'foo' }],
        ['/test_module//bar', { param2: 'bar' }],
        ['/test_module/foo/bar', { param1: 'foo', param2: 'bar' }],
        ['/test_module/foo/bar/', { param1: 'foo', param2: 'bar' }],
        ['/test_module/foo/bar//', { param1: 'foo', param2: 'bar' }],
        ['/p/hello!', { message: 'hello!' }]
      ].forEach(function (item) {
        generateFakeRequests(item[0]).forEach(function (request) {
          router.getCustom(request)
          request.querystring.should.eql(item[1], item[0])
        })
      })
    })
    it('should return undefined if none match', function () {
      router = new Router()
      router.update({ 1: { test: objectModule } })
      router.addRoute('/photo', '1/test#photo')
      generateFakeRequests('/photo', null, ['delete']).forEach(function (request) {
        should.not.exist(router.getCustom(request))
      })
    })
    it('should merge defaults with route parameters', function () {
      router = new Router()
      router.update({ 1: { test: objectModule } })
      router.addRoute('/post/:param1/:param2', '1/test#post', { param2: 'def_param2'})
      router.addRoute('/test_module/:param1/:param2', '1/test#post', { param1: false, param3: 'param3' })
      ;[
        ['/post', { param2: 'def_param2' }],
        ['/post/foo', { param1: 'foo', param2: 'def_param2' }],
        ['/post/foo/bar', { param1: 'foo', param2: 'bar' }],
        ['/test_module', { param1: false, param3: 'param3' }],
        ['/test_module/', { param1: false, param3: 'param3' }],
        ['/test_module//', { param1: false, param3: 'param3' }],
        ['/test_module/foo', { param1: 'foo', param3: 'param3' }],
        ['/test_module/foo/', { param1: 'foo', param3: 'param3' }],
        ['/test_module//bar', { param1: false, param2: 'bar', param3: 'param3' }],
        ['/test_module/foo/bar', { param1: 'foo', param2: 'bar', param3: 'param3' }],
        ['/test_module/foo/bar/', { param1: 'foo', param2: 'bar', param3: 'param3' }],
        ['/test_module/foo/bar//', { param1: 'foo', param2: 'bar', param3: 'param3' }]
      ].forEach(function (item) {
        generateFakeRequests(item[0]).forEach(function (request) {
          router.getCustom(request)
          request.querystring.should.eql(item[1], item[0])
        })
      })
    })
    it('should merge defaults with route parameters and querystring', function () {
      router = new Router()
      router.update({ 1: { test: objectModule } })
      router.addRoute('/post/:param1/:param2', '1/test#post', { param2: 'def_param2'})
      router.addRoute('/test_module/:param1/:param2', '1/test#post', { param1: false, param3: 'param3' })
      ;[
        ['/post', { param1: 'foo', param2: 'bar' }, { param1: 'foo', param2: 'bar' }],
        ['/test_module//param2//', { param1: 'foo', param3: 'bar' }, { param1: 'foo', param2: 'param2', param3: 'bar' }],
        ['/test_module//param2//', { param1: 'foo' }, { param1: 'foo', param2: 'param2', param3: 'param3' }],
      ].forEach(function (item) {
        generateFakeRequests(item[0], item[1]).forEach(function (request) {
          router.getCustom(request)
          request.querystring.should.eql(item[2], item[0])
        })
      })
    })
  })
  describe('#get()', function () {
    it('should switch between custom and default routes', function () {
      router = new Router()
      router.update({ 1: { test: objectModule } })
      router.addRoute('/post/:param1/:param2', '1/test#post')
      router.addRoute('/foo_api/:param1/:param2', '1/test#fooApi', {}, true)
      router.addRoute('/test_module/:param1/:param2', '1/test#post')
      ;[
        ['/1/test/post', false],
        ['/post/param1/param2', true],
        ['/1/test/foo_api', true],
        ['/foo_api', true],
        ['/test_module', true],
        ['/1/test/post', false]
      ].forEach(function (item) {
        generateFakeRequests(item[0]).forEach(function (request) {
          var chain = router.get(request)
          if (item[1]) {
            should.exist(chain)
          } else {
            should.not.exist(chain)
          }
        })
      })
    })
  })
})

function generateFakeMiddlewares() {
  var fakeMiddlewares = []
  for (var i = 0; i < 6; i++) {
    fakeMiddlewares.push({ index: i, handle: function () {} })
  }
  return fakeMiddlewares
}

function generateFakeRequests(pathname, querystring, httpMethods) {
  var fakeRequests = []
  httpMethods = httpMethods || Router.prototype.HTTP_METHODS
  httpMethods.forEach(function (httpMethod) {
    fakeRequests.push({
      pathname: pathname,
      querystring: querystring || {},
      method: httpMethod.toUpperCase()
    })
  })
  return fakeRequests
}

function checkChain(router, route, expetedChain, expetedMethodName, httpMethods) {
  generateFakeRequests(route, null, httpMethods).forEach(function (request) {
    var chain = router.get(request)
    should.exist(chain, route)
    chain = chain.slice(0)
    checkLastChainLink(chain.pop(), request.method, expetedMethodName)
    chain.should.eql(expetedChain, route)
  })
}

function checkLastChainLink(fn, expectedHttpMethod, expectedMethodName) {
  var ok = false
  fn(function (module, httpMethod, methodName) {
    ok = true
    module.database.should.be.equal('fake_database')
    methodName.should.be.equal(expectedMethodName)
    httpMethod.should.be.equal(expectedHttpMethod, 331)
  }, expectedHttpMethod, function (err) {
    should.not.exist(err)
  })
  ok.should.be.ok
}

function checkHttpMethods(endpoint, httpMethods) {
  httpMethods = httpMethods || Router.prototype.HTTP_METHODS
  httpMethods.forEach(function (httpMethod) {
    endpoint[httpMethod.toUpperCase()].should.be.instanceof(Array)
  })
}