module.exports = {
  amAPublicApi: function (request, response) {
    response.serveJSON({ success: true })
  },
  _notReachableAPI: function (request, response) {
    response.serveJSON({ success: true })
  },
  errorApi: function (request, response) {
    throw new Error('Aww')
  },
  'post': function (request, response) {
    response.serveJSON(request.body)
  },
  'wrong_case_api': function (request, response) {
    response.serveJSON({ success: true })
  }
}