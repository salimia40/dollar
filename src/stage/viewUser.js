
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


const scene = new Scene('viewUserScene')
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
    
    if(user == undefined) {
        ctx.reply('کاربر یافت نشد')
    } else {
        var msg = await helpers.userToStringByUser(user)
        let bills = await Bill.find({
            userId: user.userId,
            isSell: false,
            closed: true,
            left: {
                $gt: 0
            }
        })
        let count = 0

        await helpers.asyncForEach(bills,bill => {
            count += bill.left

        })

        if (count == 0) {
            bills = await Bill.find({
                userId: user.userId,
                isSell: true,
                closed: true,
                left: {
                    $gt: 0
                }
            })
            console.log(bills.length)
            await helpers.asyncForEach(bills,bill => {
                count -= bill.left

            })
            
        }
        msg += `\n موجودی آبشده : ${count}`
        await ctx.reply(msg)
        user.docs.forEach(pid => {
            ctx.replyWithPhoto(pid,{caption: `مدرک ارسالی کاربر ${user.name}`})
        });
    }
    next()
},leave())

scene.hears('خروج',
    leave()
)

module.exports = scene