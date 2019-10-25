
const Scene = require('telegraf/scenes/base')
const Transaction = require('../model/Transaction')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const helpers = require('../helpers')
const Markup = require('telegraf/markup')

const scene = new Scene('increaseScene')
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

scene.hears(/\d+/, async(ctx, next) => {
    var user
    let c = ctx.match[0]
    c = +c
    switch(ctx.session.state) {
        case 'idasked':
            ctx.session.extra = {
                id : c
            }
            user = await User.findOne({userId: ctx.session.extra.id})
            if(user == undefined) {
                ctx.reply('کاربر یافت نشد')
            } else {
                ctx.reply('مقدار مورد نظر را به صورت عددی به تومان وارد کنید')
    ctx.session.state = 'amountasked'
            }
            break
        case 'amountasked':
                user = await User.findOne({userId: ctx.session.extra.id})
                
                ctx.session.extra.amount = c
                var charge = c
                var userId = ctx.session.extra.id
                var res = await ctx.reply(`do you confirm to charge ${userId}:${user.name} with ${charge}?`,
                    Markup
                    .inlineKeyboard([
                        [{
                            text: 'تایید',
                            callback_data: 'confirm'
                        }, {
                            text: 'انصراف',
                            callback_data: 'cancel'
                        }]
                    ]).resize().extra()
                )
                ctx.session.state = JSON.stringify({
                    action: 'charge',
                    amount: charge,
                    userId: userId,
                    message_id: res.message_id
                })
                next()
            break
    }
},leave())

scene.hears('خروج',
    leave()
)

module.exports = scene