var redis = require('redis')

const options = require('./options.json')

// var client_redis = redis.createClient(options)

// var p_redis = redis.createClient(options)

// client_redis.config('set', 'notify-keyspace-events', 'KEA')

// client_redis.subscribe(`__keyevent@${options.db}__:set`, 'price')

var cb
// client_redis.on('message', function(_, key) {
//   p_redis.GET(key, (err, reply) => {
//     if (err) return
//     if (cb) cb(+reply)
//   })
// })

module.exports.listen = cbz => {
  cb = cbz
}
module.exports.stop = () => {
  cb = undefined
}
