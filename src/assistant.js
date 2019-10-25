const Telegraf = require('telegraf')
const config = require('./config')
const User = require('./model/User')

const bot = new Telegraf(config.g_token)

async function prepose() {
    const botUser = await bot.telegram.getMe();
    let busr = await User.findOne({
        userId: botUser.id
    })
    if (busr == undefined) {
        busr = new User({
            userId: botUser.id,
            name: 'ربات',
            username: 'ربات',
            role: config.role_bot_assistant
        })
        await busr.save()
    }
}
prepose()
module.exports = bot.telegram