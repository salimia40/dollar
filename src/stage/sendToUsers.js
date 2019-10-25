
const Scene = require('telegraf/scenes/base')
const Transaction = require('../model/Transaction')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const helpers = require('../helpers')
const config = require('../config')
const Markup = require('telegraf/markup')


const scene = new Scene('sendtousersScene')
scene.enter((ctx) => {
    ctx.reply('پیام خود را ارسال کنید', Markup.inlineKeyboard([
        [{text: 'انصراف', callback_data: 'cancel'}]
    ]).resize().extra())
})

scene.action('cancel',(ctx,next) => {
    ctx.deleteMessage()
    next()
},leave())

scene.hears('خروج',leave())

scene.on('message', async (ctx,next) => {
    let users = await User.find()
    helpers.asyncForEach(users,async u => {
        if(u.userId == ctx.user.userId) return
        if(u.role == config.role_bot) return
        ctx.telegram.sendCopy(u.userId,ctx.message).catch(console.log('cant send msg'))
    })
    next()
}, leave())

module.exports = scene