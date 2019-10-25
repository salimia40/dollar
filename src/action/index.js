const User = require('../model/User')
const Transaction = require('../model/Transaction')
const helpers = require('../helpers')
const config = require('../config')
const keys = config.keys
const Markup = require('telegraf/markup')

module.exports = {
    confirm: async (ctx) => {
        let state = JSON.parse(ctx.session.state)
        console.log(state)
        let user = await User.findOne({
            userId: state.userId
        })
        /**todo: send a reply dud */
        switch (state.action) {
            case 'charge':
                if (user.charge == undefined) user.charge = state.amount
                else user.charge += state.amount
                break
            case 'discharge':
                if (user.charge == undefined) user.charge = (0 - state.amount)
                else user.charge -= state.amount
                break
        }
        await user.save()
        helpers.onCharge(user.userId)

        var ischarge = state.action == 'charge'
        var explain = ischarge ? 'شارژ دستی توسط ادمین' : 'برداشت دستی توسط ادمین'

        var code = ctx.setting.getCode()
        var transaction = new Transaction({
            confirmed: true,
            userId: user.userId,
            charge: state.amount,
            code,
            explain,
            ischarge,
            done: true
        })

        await transaction.save()

        ctx.reply('انجام شد...')
        if (ischarge) {

            ctx.telegram.sendMessage(state.userId, `همکار گرامی!
مبلغ ${helpers.toman(state.amount)} تومان به موجودی مالی شما افزوده شد.`)
        } else {
            ctx.telegram.sendMessage(state.userId, `همکار گرامی!
مبلغ ${helpers.toman(state.amount)} تومان از موجودی مالی شما کاسته شد.`)

        }

        delete ctx.session.state
        ctx.telegram.deleteMessage(ctx.chat.id, state.message_id)
    },
    cancel: async (ctx) => {
        try {
            let state = JSON.parse(ctx.state.user.state)
            delete ctx.session.state
            ctx.telegram.deleteMessage(ctx.chat.id, state.message_id)
        } catch (error) {
            //
        }
    },
    confirmtransaction: async (ctx) => {
        const parts = ctx.callbackQuery.data.split(':')
        let transaction = await Transaction.findOne({
            code: +parts[1]
        })
        if (transaction.ischarge) {

            let user = await User.findOne({
                userId: transaction.userId
            })
            user.charge += transaction.charge
            await user.save()
            transaction.confirmed = true
            await transaction.save()
            ctx.telegram.sendMessage(transaction.userId, `
            درخواست تراکنش شما به شماره ${transaction.code} تایید و اکانت شما شارژ شد
            `)
            ctx.deleteMessage()
            helpers.onCharge(user.userId)
        } else {
            transaction.confirmed = true
            await transaction.save()
            ctx.telegram.sendMessage(transaction.userId, `🤵🏻 مسئول امور مالی:
            معامله گر گرامی درخواست شما به شماره : ${transaction.code} تایید شد و برای انجام در اختیار مسئول حسابداری قرار گرفت.`)
            ctx.editMessageReplyMarkup({
                inline_keyboard: [
                    [{
                        text: 'انجام شد',
                        callback_data: `donetransaction:${transaction.code}`
                    }]
                ]
            })
        }
    },
    rejecttransaction: async (ctx) => {
        const parts = ctx.callbackQuery.data.split(':')
        let transaction = await Transaction.findOne({
            code: +parts[1]
        })
        ctx.telegram.sendMessage(transaction.userId, `
        درخواست تراکنش شما به شماره ${transaction.code} رد شد
        لطفا دوباره امتحان کنید
        `)
        ctx.deleteMessage()
    },
    acceptSignUp: async (ctx) => {
        const parts = ctx.callbackQuery.data.split(':')
        var c = +parts[1]
        var user = await User.findOne({
            userId: c
        })

        let btns = [
            [keys.openfacts, keys.monthlyReport],
            [keys.postSettleReport, keys.semiSettle],
            [keys.packInv, keys.changeInv],
            [keys.userInfo, keys.contact]
        ]

        user.confirmed = true
        user = await user.save()
        ctx.telegram.sendMessage(user.userId, `
🌺 تبریک🌺
حساب شما توسط مدیر فعال شد`, Markup.keyboard(btns).resize().extra())
        // ctx.telegram.deleteMessage()

    },

    donetransaction: async (ctx) => {
        const parts = ctx.callbackQuery.data.split(':')
        let transaction = await Transaction.findOne({
            code: +parts[1]
        })
        let user = await User.findOne({
            userId: transaction.userId
        })
        user.charge -= transaction.charge
        transaction.done = true
        await user.save()
        await transaction.save()
        ctx.telegram.sendMessage(transaction.userId, `
        درخواست تراکنش شما به شماره ${transaction.code} انجام شد
        `)
        ctx.deleteMessage()
    },
    askName: (ctx, next) => {

        ctx.reply("لطفا نام خود را ارسال کنید")
        ctx.user.stage = 'nameAsked'
        ctx.session.stage = 'nameAsked'
        ctx.user.save()
        next()
    },
    askUesrName: (ctx, next) => {

        ctx.reply("لطفا نام کاربری خود را ارسال کنید")
        ctx.user.stage = 'usernameAsked'
        ctx.session.stage = 'usernameAsked'
        ctx.user.save()
        next()
    },
    askPhone: (ctx, next) => {
        ctx.reply("لطفا شماره تماس خود را وارد کنید")
        ctx.user.stage = 'phoneAsked'
        ctx.session.stage = 'phoneAsked'
        ctx.user.save()

        next()
    },
    askBank: (ctx, next) => {
        ctx.reply("please enter your bank name")
        ctx.user.stage = 'bankNameAsked'
        ctx.session.stage = 'bankNameAsked'
        ctx.user.save()
        next()
    },
    prmAdmin: async (ctx) => {
        var [_, userId] = ctx.match[0].split(':')
        userId = +userId
        var user = await User.findOne({
            userId
        })
        user.role = config.role_admin
        await user.save()
        ctx.reply(`کاربر ${user.name} به مدیر ارتقا یافت`)
        let btns = [
            [keys.openfacts, keys.monthlyReport],
            [keys.postSettleReport, keys.semiSettle],
            [keys.packInv, keys.changeInv],
            [keys.userInfo, keys.contact]
        ]
        if (ctx.user.role == config.role_owner || ctx.user.role == config.role_admin) {
            btns.push([keys.manage])
        }
        ctx.telegram.sendMessage(user.userId, `همکار گرامی ((${user.name}))
شما به مدیر ارتقا یافتید`, Markup.keyboard(btns).resize().extra())
    },
    prmMember: async (ctx) => {
        var [_, userId] = ctx.match[0].split(':')
        userId = +userId
        var user = await User.findOne({
            userId
        })
        user.role = config.role_member
        await user.save()
        ctx.reply(`کاربر ${user.name} به کاربر معمولی تنزل یافت`)
        let btns = [
            [keys.openfacts, keys.monthlyReport],
            [keys.postSettleReport, keys.semiSettle],
            [keys.packInv, keys.changeInv],
            [keys.userInfo, keys.contact]
        ]
        if (ctx.user.role == config.role_owner || ctx.user.role == config.role_admin) {
            btns.push([keys.manage])
        }
        ctx.telegram.sendMessage(user.userId, `همکار گرامی ((${user.name}))
شما به کاربر معمولی تنزل یافتید`, Markup.keyboard(btns).resize().extra())
    },
    prmVIP: async (ctx) => {
        var [_, userId] = ctx.match[0].split(':')
        userId = +userId
        var user = await User.findOne({
            userId
        })
        user.role = config.role_vip
        await user.save()
        ctx.reply(`کاربر ${user.name} به کاربر vip ارتقا یافت`)
        let btns = [
            [keys.openfacts, keys.monthlyReport],
            [keys.postSettleReport, keys.semiSettle],
            [keys.packInv, keys.changeInv],
            [keys.userInfo, keys.contact]
        ]
        if (ctx.user.role == config.role_owner || ctx.user.role == config.role_admin) {
            btns.push([keys.manage])
        }
        ctx.telegram.sendMessage(user.userId, `همکار گرامی ((${user.name}))
شما به کاربر vip ارتقا یافتید`, Markup.keyboard(btns).resize().extra())
    },
    prmEcc: async (ctx) => {

        let btns = [
            [keys.openfacts, keys.monthlyReport],
            [keys.postSettleReport, keys.semiSettle],
            [keys.packInv, keys.changeInv],
            [keys.userInfo, keys.contact]
        ]

        var [_, userId] = ctx.match[0].split(':')
        userId = +userId
        if (curr != undefined) {

            var curr = await User.findOne({
                role: config.role_eccountant
            })
            if (curr != undefined) {
                curr.role = config.role_member
                curr = await curr.save()
            }

            ctx.telegram.sendMessage(curr.userId, `همکار گرامی ((${curr.name}))
شما به کاربر معمولی تنزل یافتید`, Markup.keyboard(btns).resize().extra())
        }

        var user = await User.findOne({
            userId
        })
        user.role = config.role_eccountant
        await user.save()
        ctx.reply(`کاربر ${user.name} به کاربر حسابدار ارتقا یافت`)
        
        if (user.role == config.role_owner || user.role == config.role_admin || user.role == config.role_eccountant) {
            btns.push([keys.manage])
        }
        ctx.telegram.sendMessage(user.userId, `همکار گرامی ((${user.name}))
شما به حسابدار ارتقا یافتید از این پس پیغام های حسابداری برای شما ارسال خواهد شد`, Markup.keyboard(btns).resize().extra())
    }
}