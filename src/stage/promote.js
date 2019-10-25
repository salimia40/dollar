
const Scene = require('telegraf/scenes/base')
const Transaction = require('../model/Transaction')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const Bill = require('../model/Bill')
const helpers = require('../helpers')
const queue = require('../queue')
const config = require('../config')
const Markup = require('telegraf/markup')


const scene = new Scene('promoteScene')
scene.enter((ctx) => {
    ctx.reply('لطفا کد کاربری مربوط به کاربر مورد نظر را وارد کنید', Markup.inlineKeyboard([
        [{text: 'انصراف', callback_data: 'cancel'}]
    ]).resize().extra())
})

scene.action('cancel',(ctx,next) => {
    ctx.deleteMessage()
    next()
},leave())

scene.hears(/\d+/, async(ctx, next) => {
    var c = ctx.match[0]
    c= +c
    var user = await User.findOne({userId:c})
    
    console.log(user)
    console.log(user.username)
        console.log(user.name)
        console.log(user.userId)
    if(user == undefined) {
        ctx.reply('کاربر یافت نشد')
    } else {
        console.log(user)
        console.log(user.username)
        console.log(user.name)
        console.log(user.userId)
        ctx.reply(`نقش کاربر ((${user.username})) را انتخاب کنید
        
توجه داشته باشد که درصورت انتصاب حساب دار جدید حسابدار قبلی به کاربر معمولی تبدیل می شود`,{
            reply_markup: {
                inline_keyboard: [[
                    {text:'کاربر معمولی', callback_data: `${config.role_member}:${user.userId}`},
                    {text:'کاربر مدیر', callback_data: `${config.role_admin}:${user.userId}`},
                    {text:'حسابدار', callback_data: `${config.role_eccountant}:${user.userId}`},
                    {text:'کاربر vip', callback_data: `${config.role_vip}:${user.userId}`},
                ]]
            }
        })
    }
    next()
},leave())

scene.hears('خروج',
    leave()
)

module.exports = scene