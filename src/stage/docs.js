const Scene = require('telegraf/scenes/base')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const setting = require('../model/Setting')
const helpers = require('../helpers')
const Markup = require('telegraf/markup')


const scene = new Scene('docsScene')
scene.enter((ctx) => {
    console.log('docs scene')
    ctx.reply('لطفا مدارک خود را  به صورت تصویر ارسال  کنید ( کپی کارت ملی یا پروانه کسب یا صفحه اول شناسنامه یا کارت پایان خدمت) و هنگام اتمام دکمه ثبت را بزنید:', Markup.inlineKeyboard([
        [{
            text: 'تایید',
            callback_data: 'confirm'
        }]
    ]).resize().extra())
})

scene.action('confirm', (ctx, next) => {
    ctx.reply('مدارک شما با موفقیت ثبت شد')
    next()
}, leave())

scene.on('photo', async ctx => {
    ctx.user.docs.push(ctx.message.photo[ctx.message.photo.length - 1].file_id)
    await ctx.user.save()
})


module.exports = scene