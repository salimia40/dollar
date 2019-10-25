const config = require('../config')
const { keys } = config
const helpers = require('../helpers')
const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const User = require('../model/User')

const {
    leave
} = require('telegraf/stage')

let supportScene = new Scene('supportScene')

supportScene.enter(async (ctx) => {
    ctx.reply('پیام خود را بنویسید این پیام به پشتبانی ارسال و درصورت پاسخ از همین طریق پاسخ به دست شما خواهد رسید')
    ctx.reply('در صورت انصراف یا اتمام پیام با محتوی "اتمام" ارسال کنید',Markup.inlineKeyboard([[{
        text: 'اتمام', 
        callback_data: 'end'
    }]]).resize().extra())
})

supportScene.hears("اتمام", (ctx, next) => {
    delete ctx.session.status
    next()
},leave())

supportScene.action("end", (ctx, next) => {
    delete ctx.session.status
    ctx.deleteMessage()
    next()
},leave())

supportScene.on('message', async (ctx) => {
    
    let owner = await User.findOne({
        role: 'bot-owner'
    })

    let msg = 'پیام کاربر ' + ctx.user.name + '\n\n کد کاربری  ' + ctx.user.userId
    await ctx.telegram.sendMessage(owner.userId,msg)
    ctx.telegram.sendCopy(owner.userId,ctx.message).catch(console.log('cant send msg'))
})

module.exports = supportScene