
const Scene = require('telegraf/scenes/base')
const Transaction = require('../model/Transaction')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const helpers = require('../helpers')
const Markup = require('telegraf/markup')


const scene = new Scene('delayScene')
scene.enter((ctx) => {
    ctx.reply('لطفا مدت مد نظر خود را به ثانیه به صورت عددی وارد نمایید.', Markup.inlineKeyboard([
        [{text: 'انصراف', callback_data: 'cancel'}]
    ]).resize().extra())
})

scene.action('cancel',(ctx,next) => {
    ctx.deleteMessage()
    next()
},leave())

scene.hears(/\d+/, async(ctx, next) => {
    let c = ctx.match[0]
    c= +c
    ctx.setting.setDelay(c)
    let group = await ctx.setting.getActiveGroup()
    // ctx.reply(JSON.parse(groups))
    console.log(group)
    ctx.telegram.sendMessage(group, `💫 اعتبار لفظ: ${c} ثانیه 💫`)
    next()
},leave())

scene.hears('خروج',
    leave()
)

module.exports = scene