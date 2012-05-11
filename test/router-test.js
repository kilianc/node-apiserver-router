var should = require('should'),
    Router = require('../'),
    testModule = require('./fixtures/router-module')

var router
var fakeMiddlewares = []

for (var i = 0; i < 6; i++) {
  fakeMiddlewares.push(fakeMiddleware(i))
}

function fakeMiddleware(i) {
  return { index: i, handle: function () {} }
}

function checkLastChainLink(fn) {
  fn(null, null, function (err) {
    should.exist(err)
  })
  fn({ body: '' }, { serveJSON: function () {} }, function (err) {
    if (err && err.message !== 'Aww') {
      throw new Error('err shouldn\'t exist or have a different message than "Aww" ' + (err && err.message))
    }
  })
}

function checkChain(router, route, expetedChain) {
  var chain = router.get({ pathname: route })
  checkLastChainLink(chain.pop())
  chain.should.eql(expetedChain, route)
}

describe('Router', function () {
  before(function () {
    router = new Router()
    router.update({ v1: { test: testModule } }, [
      { route: /.+/, handle: fakeMiddlewares[0] },
      { route: /\/am_a/, handle: fakeMiddlewares[1] },
      { route: /api/, handle: fakeMiddlewares[2] },
      { route: /error/, handle: fakeMiddlewares[3] },
      { route: /\/v1\/test\/post/, handle: fakeMiddlewares[4] },
      { route: /\/v1\/test\/.+o.+/, handle: fakeMiddlewares[5] }
    ])
  })
  it('should skip private methods', function () {
    new should.Assertion(router.routes).not.have.property('/v1/test/_not_reachable')
  })
  it('should create routes', function () {
    new should.Assertion(router.routes).have.keys([
      '/v1/test/am_a_public_api',
      '/v1/test/error_api',
      '/v1/test/post',
      '/v1/test/wrong_case_api'
    ])
  })
  it('should routes must be Array', function () {
    router.routes['/v1/test/am_a_public_api'].should.be.an.instanceof(Array)
    router.routes['/v1/test/error_api'].should.be.an.instanceof(Array)
    router.routes['/v1/test/post'].should.be.an.instanceof(Array)
    router.routes['/v1/test/wrong_case_api'].should.be.an.instanceof(Array)
  })
  it('should map correctly routes to middleware', function () {
    checkChain(router, '/v1/test/am_a_public_api', [fakeMiddlewares[0], fakeMiddlewares[1], fakeMiddlewares[2]])
    checkChain(router, '/v1/test/error_api', [fakeMiddlewares[0], fakeMiddlewares[2], fakeMiddlewares[3], fakeMiddlewares[5]])
    checkChain(router, '/v1/test/post', [fakeMiddlewares[0], fakeMiddlewares[4], fakeMiddlewares[5]])
    checkChain(router, '/v1/test/wrong_case_api', [fakeMiddlewares[0], fakeMiddlewares[2], fakeMiddlewares[5]])
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