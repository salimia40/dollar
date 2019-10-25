const Bot = require('./bot')
const config = require('./config')

Bot(config.token).then(bot => {
    bot.launch().catch(console.log)
    console.info('bot started successfully')
}).catch(console.log)

// require('./web')