const Bot = require('./bot')

Bot().then(bot => {
    bot.launch().catch(console.log)
    console.info('bot started successfully')
}).catch(console.log)

// require('./web')