const config = require('../config')
const {
    keys
} = config
const helpers = require('../helpers')
const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const User = require('../model/User')
const {
    leave
} = require('telegraf/stage')

let scene = new Scene('replyScene')

scene.enter((ctx) => {
    ctx.reply('لطفا کد کاربری مربوط به کاربر مورد نظر را وارد کنید', Markup.inlineKeyboard([
        [{text: 'انصراف', callback_data: 'cancel'}]
    ]).resize().extra())
})

scene.action('cancel',(ctx,next) => {
    ctx.deleteMessage()
    next()
},leave())

scene.hears(/\d+/, async (ctx, next) => {
    var c = ctx.match[0]
    c = +c
    var user = await User.findOne({
        userId: c
    })

    console.log(user)
    console.log(user.username)
    console.log(user.name)
    console.log(user.userId)
    if (user == undefined) {
        ctx.reply('کاربر یافت نشد')
        next()
    } else {
        ctx.reply('پیام خود را بنویسید')
        ctx.reply('در حال ارتبات با ' + user.name)

        ctx.reply('در صورت انصراف یا اتمام پیام با محتوی "اتمام" ارسال کنید', Markup.inlineKeyboard([
            [{
                text: 'اتمام',
                callback_data: 'end'
            }]
        ]).resize().extra())
        ctx.session.status = {
            state: 'waiting for massage',
            userId: user.userId
        }
    }
}, leave())

scene.hears("اتمام", (ctx, next) => {
    delete ctx.session.status
    next()
}, leave())
scene.action("end", (ctx, next) => {
    delete ctx.session.status
    ctx.deleteMessage()
    next()
}, leave())

scene.on('message', async (ctx) => {

    if (ctx.session.status != undefined && ctx.session.status.state == 'waiting for massage') {
        ctx.telegram.sendCopy(ctx.session.status.userId, ctx.message).catch(console.log('cant send msg'))
    }
})

module.exports = scene