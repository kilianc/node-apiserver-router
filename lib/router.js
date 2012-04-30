var Router = module.exports = function () {
  this.routes = {}
}

Router.prototype.update = function (modules, middlewareList) {
  var routes = Object.create(null)
  var map = Object.create(null)
  Object.keys(modules).forEach(function (version) {
    Object.keys(modules[version]).forEach(function (moduleName) {
      var module_name = moduleName.replace(/([A-Z][a-z][^A-Z]*)/g, '_$1').toLowerCase()
      Object.keys(modules[version][moduleName]).forEach(function (methodName) {
        if (methodName[0] === '_') {
          return
        }
        var route = getRoutePath(version, module_name, methodName)
        if (routes[route]) {
          throw new Error('Routing conflict on "' + route + '": ' + map[route].version + '.' + map[route].moduleName + '.' + map[route].methodName +
                          ' is anbiguous with ' + version + '.' + moduleName + '.' + methodName)
        }
        map[route] = { version: version, moduleName: moduleName, methodName: methodName }
        var chain = routes[route] = getChain(middlewareList, route)
        chain.push(function (request, response, callback) {
          try {
            modules[version][moduleName][methodName](request, response)
            callback()
          } catch (err) {
            callback(err)
          }
        })
      })
    })
  })
  this.routes = routes
}

Router.prototype.get = function (pathname) {
  return this.routes[pathname]
}

function getRoutePath(version, module_name, methodName) {
  var words = []
  methodName.replace(/([A-Za-z][^A-Z]*)/g, function (match) { words.push(match) })
  return ['', version, module_name, words.join('_')].join('/').toLowerCase()
}

function getChain(middlewareList, route) {
  var chain = []
  if (middlewareList) {
    middlewareList.forEach(function (middleware) {
      if (route.match(middleware.route)) {
        chain.push(middleware.handle)
      }
    })
  }
  return chain
}