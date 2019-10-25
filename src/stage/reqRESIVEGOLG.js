// reqRESIVEGOLG


const Scene = require('telegraf/scenes/base')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const helpers = require('../helpers')
const config = require('../config')


const scene = new Scene('reqRESIVEGOLG')
scene.enter((ctx) => {
    ctx.reply('لطفا مبلغ کد معامله مورد نظر را اسال کنید وارد نمایید.')
})

scene.hears(/\d+/, async(ctx, next) => {
    let c = ctx.match[0]
    ctx.reply('درخواست شما به حسابدار ارسال شد منتظر تماس باشید')
    var eccountant = await User.findOne({role: config.role_eccountant})
    if(eccountant == undefined) 
        eccountant = await User.findOne({role: config.role_owner})
    
    ctx.telegram.sendMessage( eccountant.userId,`
کاربر با کد کاربری ${ctx.user.userId}
به نام ${ctx.user.name}
و شماره تماس ${ctx.user.phone}
درخواست تحویل فیزیکی معامله با کد ${c} دارد
    `)
    
    next()
},leave())

scene.hears('خروج',
    leave()
)

module.exports = scene