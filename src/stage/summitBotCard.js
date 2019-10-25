const Scene = require('telegraf/scenes/base')
const Transaction = require('../model/Transaction')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const config = require('../config')
const Markup = require('telegraf/markup')


const scene = new Scene('sumitBotCardScene')
scene.enter((ctx) => {
    ctx.reply('لطفا شماره کارت را به صورت عددی ارسال کنید', Markup.inlineKeyboard([
        [{
            text: 'انصراف',
            callback_data: 'cancel'
        }]
    ]).resize().extra())
    ctx.session.state = 'numasked'
})

scene.action('cancel', (ctx, next) => {
    ctx.deleteMessage()
    next()
}, leave())

scene.on('text', async (ctx, next) => {
    let c = ctx.message.text
    if(ctx.session.extra == undefined){
        ctx.session.extra = {}
    }
    switch (ctx.session.state) {
        case 'numasked':
            if (/[\d -]+/.test(c)) {
                ctx.session.extra.card = c
                ctx.session.state = 'shabaAsked'
                ctx.reply(`شماره شبای کارت را وارد کنید`)
            } else {
                ctx.reply('شماره حساب میتواند دارای عدد، خط فاصله و فاصله باشد. دوباره امتحان کنید')
            }
            break
        case 'shabaAsked':
            // if (/^IR\d{24}$/.test(c)) {
                ctx.session.extra.shaba = c
                ctx.reply(`نام مالک کارت را وارد کنید`)
                ctx.session.state = 'ownerAsked'
            // } else {
            //     ctx.reply(' شماره شبا با IR شروع میشود و 24 رقم دارد. دوباره امتحان کنید')
            // }

            break
        case 'ownerAsked':
            ctx.setting.setCard(ctx.session.extra.card, ctx.session.extra.shaba, c)
            ctx.reply(ctx.setting.getCardString())
            next()
            break
    }
}, leave())

scene.hears('خروج',
    leave()
)

module.exports = scene