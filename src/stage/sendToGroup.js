
const Scene = require('telegraf/scenes/base')
const Transaction = require('../model/Transaction')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const helpers = require('../helpers')
const assistant = require('../assistant')
const Markup = require('telegraf/markup')


const scene = new Scene('sendtogroupScene')
scene.enter((ctx) => {
    ctx.reply('پیام خود را ارسال کنید', Markup.inlineKeyboard([
        [{text: 'انصراف', callback_data: 'cancel'}]
    ]).resize().extra())
})

scene.action('cancel',(ctx,next) => {
    ctx.deleteMessage()
    next()
},leave())

scene.hears('خروج',
leave()
)

scene.on('message', async (ctx,next) => {
    let group = await ctx.setting.getActiveGroup()
    assistant.sendCopy(group,ctx.message)
    next()
}, leave())

module.exports = scene