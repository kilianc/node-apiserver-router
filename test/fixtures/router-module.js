function getFakeApi(name, httpMethod) {
  return function (cb, requestHttpMethod) {
    cb(this, httpMethod || requestHttpMethod, name)
  }
}

module.exports = {
  database: 'fake_database',
  _privateMethod: getFakeApi('_privateMethod'),
  amAPublicApi: getFakeApi('amAPublicApi'),
  fooApi: getFakeApi('fooApi'),
  post: getFakeApi('post'),
  wrong_case_api: getFakeApi('wrong_case_api'),
  AA: getFakeApi('AA'),
  photo: {
    get: getFakeApi('photo', 'GET'),
    post: getFakeApi('photo', 'POST'),
    delete: 'not_a_function'
  }
}