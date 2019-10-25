const Scene = require('telegraf/scenes/base')
const Transaction = require('../model/Transaction')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const helpers = require('../helpers')
const config = require('../config')
const Markup = require('telegraf/markup')


const scene = new Scene('giftScene')
scene.enter((ctx) => {
    ctx.reply('لطفا شماره کاربری مربوط به کاربر مورد نظر را به صورت عددی ارسال کنید', Markup.inlineKeyboard([
        [{text: 'انصراف', callback_data: 'cancel'}]
    ]).resize().extra())
    ctx.session.state = 'idasked'
})


scene.action('cancel',(ctx,next) => {
    ctx.deleteMessage()
    next()
},leave())

scene.hears(/\d+/, async (ctx, next) => {
    var user
    let c = ctx.match[0]
    c = +c
    switch (ctx.session.state) {
        case 'idasked':
            ctx.session.extra = {
                id: c
            }
            user = await User.findOne({
                userId: ctx.session.extra.id
            })
            if (user == undefined) {
                ctx.reply('کاربر یافت نشد')
            } else {
                ctx.reply('مقدار مورد نظر را به صورت عددی به هزار تومان وارد کنید')
                ctx.session.state = 'amountasked'
            }
            break
        case 'amountasked':
            // user = await User.findOne({userId: ctx.session.extra.id})
            ctx.session.extra.amount = c
            ctx.reply('حجم کل معاملات جهت فعالسازی را به صورت عددی به کیلوگرم وارد کنید')
            
            ctx.session.state = 'reqasked'
            break
        case 'reqasked':
            var req = c * 10
            user = await User.findOne({
                userId: ctx.session.extra.id
            })
            console.log(ctx.session.extra.amount)
            if (user.gift == undefined) {
                user.gift = {
                    req,
                    charge: ctx.session.extra.amount,
                    activated: false
                }
            } else {
                user.gift.req = req
                user.gift.charge = ctx.session.extra.amount
                user.gift.activated = false
            }
            user = await user.save()
            var msg = config.samples.giftMessage
                .replace('x',helpers.toman(ctx.session.extra.amount))
                .replace('x',c)
            ctx.telegram.sendMessage(user.userId,msg)
            ctx.reply('انجام شد!')
            next()
            helpers.onCharge(user.userId)

    }
}, leave())

scene.hears('خروج',
    leave()
)

module.exports = scene