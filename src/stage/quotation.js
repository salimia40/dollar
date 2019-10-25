const Scene = require('telegraf/scenes/base')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const setting = require('../model/Setting')
const helpers = require('../helpers')
const Markup = require('telegraf/markup')


const scene = new Scene('quotationScene')
scene.enter((ctx) => {
    ctx.reply('لطفا مبلغ مد نظر خود را به تومان به صورت عددی وارد نمایید.', Markup.inlineKeyboard([
        [{
            text: 'انصراف',
            callback_data: 'cancel'
        }]
    ]).resize().extra())
})

scene.action('cancel', (ctx, next) => {
    ctx.deleteMessage()
    next()
}, leave())

scene.hears(/\d+/, async (ctx, next) => {
    let c = ctx.match[0]
    c = +c
    if (Math.abs(setting.getQuotation() - c) > setting.getTolerance) {
        ctx.reply(`اخنلاف بین مظنه وارد شده ${c} و مظنه مفعلی ${setting.getQuotation()} بالاست. آیا تایید میکنید؟`,Markup.inlineKeyboard([
            [{
                text: 'انصراف',
                callback_data: 'bikhi'
            }],
            [{
                text: 'تایید میکنم',
                callback_data: `quotation:${c}`
            }],
        ]).resize().extra())
    } else
        helpers.setQuotation(ctx, c)
    next()
}, leave())

scene.hears('خروج',
    leave()
)

module.exports = scene