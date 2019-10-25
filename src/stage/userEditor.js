const Telegraf = require('telegraf')
const Composer = require('telegraf/composer')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const User = require('../model/User')
const helpers = require('../helpers')

const uidHandler = new Composer()

uidHandler.hears(/^\d+$/, async (ctx) => {
    var c = ctx.message.text
    try {
        c = +c
        var user = await User.findOne({
            userId: c
        })
        if (user == undefined) return ctx.reply('کاربر یافت نشد دوباره امتحان کنید')
        ctx.scene.session.uid = c
        var txt = await helpers.userToStringByUser(user)
        ctx.reply(txt)
        ctx.reply('لطفا نام و نام خانوادگی کاربر را وارد کنید', Markup.inlineKeyboard([
            [
                {
                text: 'انصراف',
                callback_data: 'cancel'
            },
                {
                text: 'بعدی',
                callback_data: 'next'
            },
        ]
        ]).resize().extra())

        ctx.wizard.next()


    } catch (error) {
        return ctx.reply('کاربر یافت نشد دوباره امتحان کنید')
    }
})

uidHandler.action('cancel', (ctx) => {
    ctx.answerCbQuery('انصراف دادید',false)
    return ctx.scene.leave()
})


const nameHandler = new Composer()

nameHandler.action('cancel', (ctx) => {
    ctx.answerCbQuery('انصراف دادید',false)
    return ctx.scene.leave()
})
nameHandler.action('next', (ctx) => {
    ctx.reply(`نام کاربری را وارد کنید:`, Markup.inlineKeyboard([
        [
            {
            text: 'انصراف',
            callback_data: 'cancel'
        },
            {
            text: 'بعدی',
            callback_data: 'next'
        },
    ]
    ]).resize().extra())
    return ctx.wizard.next()
})

nameHandler.on('text', async (ctx) => {
    var userId = ctx.scene.session.uid
    if(userId == undefined) {
        ctx.reply('خطای ربات')
        return  ctx.scene.leave()
    }
    try {
        var user = await User.findOneAndUpdate({userId},{name: ctx.message.text})
        ctx.reply(`ثبت شد: ${ctx.message.text}\n نام کاربری را وارد کنید:`, Markup.inlineKeyboard([
            [
                {
                text: 'انصراف',
                callback_data: 'cancel'
            },
                {
                text: 'بعدی',
                callback_data: 'next'
            },
        ]
        ]).resize().extra())
    } catch (error) {
        //
    }
    return ctx.wizard.next()

})
const unameHandler = new Composer()

unameHandler.action('cancel', (ctx) => {
    ctx.answerCbQuery('انصراف دادید',false)

    return ctx.scene.leave()
})
unameHandler.action('next', (ctx) => {
    ctx.reply(`شماره تماس را وارد کنید:`, Markup.inlineKeyboard([
        [
            {
            text: 'انصراف',
            callback_data: 'cancel'
        },
            {
            text: 'بعدی',
            callback_data: 'next'
        },
    ]
    ]).resize().extra())
    return ctx.wizard.next()
})

unameHandler.on('text', async (ctx) => {
    var userId = ctx.scene.session.uid
    if(userId == undefined) {
        ctx.reply('خطای ربات')
        return  ctx.scene.leave()
    }
    try {
        var user = await User.findOneAndUpdate({userId},{username: ctx.message.text})
        ctx.reply(`ثبت شد: ${ctx.message.text}\n شماره تماس را وارد کنید:`, Markup.inlineKeyboard([
            [
                {
                text: 'انصراف',
                callback_data: 'cancel'
            },
                {
                text: 'بعدی',
                callback_data: 'next'
            },
        ]
        ]).resize().extra())
    } catch (error) {
        //
    }
    return ctx.wizard.next()

})
const pnameHandler = new Composer()

pnameHandler.action('cancel', (ctx) => {
    ctx.answerCbQuery('انصراف دادید',false)

    return ctx.wizard.leave()
})
pnameHandler.action('leave', (ctx) => {
    ctx.answerCbQuery('با موفقیت خارج شدید دادید',false)

    return ctx.wizard.next()
})

pnameHandler.action('next', (ctx) => {
    ctx.reply('در صورت تمایل وجه تضمین کاربر(هزار تومان) را وارد کنید.',Markup.inlineKeyboard([
        [
            {
                text: 'تنظیمات اصلی',
                callback_data: 'asroutine'
            },
            {
                text: 'ثابت بماند',
                callback_data: 'keepsetting'
            }
        ],
        // [
        //     {
        //         text: 'انصراف',
        //         callback_data: 'cancel'
        //     },
        // ]
    ]).resize().extra())
    return ctx.wizard.next()
})


pnameHandler.on('text', async (ctx) => {
    var userId = ctx.scene.session.uid
    if(userId == undefined) {
        ctx.reply('خطای ربات')
        return  ctx.scene.leave()
    }
    try {
        var user = await User.findOneAndUpdate({userId},{phone: ctx.message.text})
        ctx.reply(`ثبت شد: ${ctx.message.text}\n`,)
        ctx.reply('در صورت تمایل وجه تضمین کاربر(هزار تومان) را وارد کنید.',Markup.inlineKeyboard([
            [
                {
                    text: 'تنظیمات اصلی',
                    callback_data: 'asroutine'
                },
                {
                    text: 'ثابت بماند',
                    callback_data: 'keepsetting'
                }
            ],
            // [
            //     {
            //         text: 'انصراف',
            //         callback_data: 'cancel'
            //     },
            // ]
        ]).resize().extra())
    } catch (error) {
        //
    }
    return ctx.wizard.next()
})


const bcHandler = new Composer()

bcHandler.action('cancel', (ctx) => {
    ctx.answerCbQuery('انصراف دادید',false)

    return ctx.wizard.leave()
})

const askVip = (ctx) => {
    ctx.reply('در صورت تمایل تخفیف کمیسیون را وارد کنید.',Markup.inlineKeyboard([
        [
            {
                text: 'تنظیمات اصلی',
                callback_data: 'asroutine'
            },
            {
                text: 'ثابت بماند',
                callback_data: 'keepsetting'
            }
        ],
        // [
        //     {
        //         text: 'انصراف',
        //         callback_data: 'cancel'
        //     },
        // ]
    ]).resize().extra())
    return ctx.wizard.next()
}

bcHandler.hears(/\d+/, async (ctx,next) => {
    var c = ctx.match[0]
    c = +c

    var userId = ctx.scene.session.uid
    if(userId == undefined) {
        ctx.reply('خطای ربات')
        return  ctx.scene.leave()
    }
    try {
        var user = await User.findOneAndUpdate({userId},{config : {baseCharge: c}})
        
    } catch (error) {
        //
    }
    return next()
},askVip)

bcHandler.action('asroutine',async(ctx,next) => {
    var userId = ctx.scene.session.uid
    if(userId == undefined) {
        ctx.reply('خطای ربات')
        return  ctx.scene.leave()
    }
    try {
        var user = await User.findOneAndUpdate({userId},{config : {baseCharge: -1}})
        
    } catch (error) {
        //
    }
    return next()
},askVip)

bcHandler.action('keepsetting',async(ctx,next) => {
    var userId = ctx.scene.session.uid
    if(userId == undefined) {
        ctx.reply('خطای ربات')
        return  ctx.scene.leave()
    }
    
    return next()
},askVip)


bcHandler.action('cancel', (ctx) => {
    ctx.answerCbQuery('انصراف دادید',false)

    return ctx.scene.leave()
})

const vipHandler = new Composer()

vipHandler.hears(/\d+/, async (ctx) => {
    var c = ctx.match[0]
    c = +c

    var userId = ctx.scene.session.uid
    if(userId == undefined) {
        ctx.reply('خطای ربات')
        return  ctx.scene.leave()
    }
    try {
        var user = await User.findOneAndUpdate({userId},{config : {vipOff: c}})
        ctx.reply(helpers.userToStringByUser(user))
        
    } catch (error) {
        //
    }
    return ctx.scene.leave()
})

vipHandler.action('asroutine',async(ctx) => {
    var userId = ctx.scene.session.uid
    if(userId == undefined) {
        ctx.reply('خطای ربات')
        return  ctx.scene.leave()
    }
    try {
        var user = await User.findOneAndUpdate({userId},{config : {vipOff: -1}})
        ctx.reply(helpers.userToStringByUser(user))
        
    } catch (error) {
        //
    }

    return ctx.scene.leave()
})

vipHandler.action('keepsetting',async(ctx) => {
    var userId = ctx.scene.session.uid
    console.log(userId)
    if(userId == undefined) {
        ctx.reply('خطای ربات')
        return  ctx.scene.leave()
    }
    try {
        var user = await User.findOne({userId})
        ctx.reply(await helpers.userToStringByUser(user))
    } catch (error) {
        //
        // delete
    }
    
    return ctx.scene.leave()
})


const scene = new WizardScene('usereditor',
    async (ctx) => {
        ctx.reply('لطفا شماره کاربری مورد نظر را وارد کنید:', Markup.inlineKeyboard([
                [{
                    text: 'انصراف',
                    callback_data: 'cancel'
                }]
            ]).resize().extra())
        return ctx.wizard.next()
    },
    uidHandler,
    nameHandler,
    unameHandler,
    pnameHandler,
    bcHandler,
    vipHandler
    )

    module.exports = scene