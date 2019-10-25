
const Scene = require('telegraf/scenes/base')
const Transaction = require('../model/Transaction')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const helpers = require('../helpers')
const Markup = require('telegraf/markup')


const scene = new Scene('offScene')
scene.enter((ctx) => {
    ctx.reply('لطفا درصدی از کمیسیون که قصد در یافت دارید را به صورت عددی وارد نمایید. برای مثال 50', Markup.inlineKeyboard([
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
    ctx.setting.setVipOff(c)
    ctx.reply(`ثبت شد: ${c}`)
    next()
},leave())

scene.hears('خروج',
    leave()
)

module.exports = scene