const updateLogger = require('telegraf-update-logger')
const fs = require('fs')
const path = require('path')

module.exports = (bot) => {
    bot.use(
        updateLogger({
          log: str => fs.appendFileSync(path.join(__dirname,'..','..','messages.log'), str + '\n'),
          // colors: true
        }),
      )
}