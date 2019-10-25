const User = require('../model/User')
const Setting = require('../model/Setting')
const helpers = require('../helpers')
const config = require('../config')
const
    persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g],
    arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g],
    fixNumbers = function (str) {
        if (typeof str === 'string') {
            for (var i = 0; i < 10; i++) {
                str = str.replace(persianNumbers[i], i).replace(arabicNumbers[i], i);
            }
        }
        return str;
    }

module.exports = {
    boundUser: async (ctx, next) => {
        var user = await User.findOne({
            userId: ctx.from.id
        })
        if (user == undefined) {
            user = new User({
                userId: ctx.from.id
            })
            user = await user.save()
        }
        ctx.user = user
        next()
    },
    boundSetting: async (ctx, next) => {
        ctx.setting = Setting
        next()
    },
    checkIfGroupAdmin: (botUser) => {
        return async (ctx, next) => {
            // no problem with private chats
            if (helpers.isPrivate(ctx)) return next()
    
            let isBdmin = await helpers.isGroupAdmin(ctx,botUser)
            if (isBdmin) return next()
            ctx.reply('ربات برای فعالیت نیاز به ادمین بودن دارد')
        }
    },
    fixNumbers: (ctx, next) => {
        if (ctx.message != undefined && ctx.message.text != undefined)
            ctx.message.text = fixNumbers(ctx.message.text)
        next()
    },
    filterMessages: (ctx, next) => {
        if(ctx.user.role == config.role_admin || ctx.user.role == config.role_bot_assistant || ctx.user.role == config.role_owner) return next()
        if (helpers.isPrivate(ctx)) {
            if (ctx.updateType == "message" && ctx.updateSubTypes.includes('text') && ctx.updateSubTypes.length == 1) return next()
            else if (ctx.updateType == "callback_query") return next()
        } else {
            ctx.deleteMessage()
            if (ctx.updateType == "message" && ctx.updateSubTypes.includes('text') && ctx.updateSubTypes.length == 1) return next()
            else if (ctx.updateType == "callback_query") return next()
        }
    },
    checkUserCompleted: (ctx, next) => {
        // if(!ctx.user.confirmed) {
        //     ctx.telegram.sendMessage(ctx.message.from.id, 'فعالیت شما در ربات هنوز تایید نشده است')
        // }
        if (helpers.isPrivate || ctx.user.stage == 'completed') return next()
        ctx.telegram.sendMessage(ctx.message.from.id, 'لطفا ابتدا اقدام به تکمیل حساب خود فرمایید')
    }

}