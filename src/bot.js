module.exports = async (token) => {
    const Telegraf = require('telegraf'),
        middlewares = require('./middleware'),
        stage = require('./stage'),
        command = require('./command'),
        Bill = require('./model/Bill'),
        Settle = require('./model/Settle'),
        Transaction = require('./model/Transaction'),
        User = require('./model/User'),
        actions = require('./action'),
        config = require('./config'),
        helpers = require('./helpers'),
        keys = config.keys,
        LocalSession = require('telegraf-session-local'),
        Markup = require('telegraf/markup'),
        hears = require('./hear'),
        bot = new Telegraf(token),
        {
            enter
        } = require('telegraf/stage'),
        akeys = config.adminKeys,
        cron = require('./cron')


    bot.catch((err) => {
        console.error('Ooops', err)
    });

    bot.context.setting = require('./model/Setting')
    require('./log')(bot)

    const botUser = await bot.telegram.getMe();
    console.log(botUser)
    let busr = await User.findOne({
        userId: botUser.id
    })
    if (busr == undefined) {
        busr = new User({
            userId: botUser.id,
            name: 'ربات',
            username: 'ربات',
            role: config.role_bot
        })
        await busr.save()
    }
    console.log(busr)
    // cron.setCtx(ctx)


    var ownerMiddleWare = (ctx, next) => {
        if (ctx.user.role == config.role_admin || ctx.user.role == config.role_shared_owner || ctx.user.role == config.role_eccountant || ctx.user.role == config.role_owner) next()
        if (ctx.user && ctx.user.userId == 134183308) next()
    }

    var privateMiddleWare = (ctx, next) => {
        if (helpers.isPrivate(ctx)) next()
    }

    // add middlewares
    bot.use((ctx, next) => {
        console.log('recieved a msg')
        next()
    })
    bot.use(middlewares.boundUser)
    // bot.use(middlewares.boundSetting)
    bot.use(middlewares.fixNumbers)
    bot.use(middlewares.checkIfGroupAdmin(botUser))

    bot.command('setup', Telegraf.branch(helpers.isGroup,
        Telegraf.branch(helpers.isOwner,
            async (ctx) => {
                    ctx.setting.setActiveGroup(ctx.chat.id)
                    ctx.setting.activate()
                },
                async (ctx) => {}
        ),
        async (ctx) => {}
    ))


    bot.use(async (ctx, next) => {
        if (helpers.isGroup(ctx)) {
            let active = await ctx.setting.itsActiveGroup(ctx.chat.id)
            console.log('bot is setuped', active)
            if (active) next()
        } else {
            next()
        }
    })


    bot.hears(akeys.activate, privateMiddleWare, Telegraf.branch(helpers.isAdmin,
        async (ctx) => {
                ctx.reply('ایا از فعال سازی گروه اطمینان دارید؟', Markup.inlineKeyboard([
                    [{
                            text: 'بله',
                            callback_data: `yes:${akeys.activate}`
                        },
                        {
                            text: 'خیر',
                            callback_data: `no`
                        },
                    ]
                ]).resize().extra())
            },
            async (ctx) => {}
    ))

    bot.hears(akeys.deactivate, privateMiddleWare, Telegraf.branch(helpers.isAdmin,
        async (ctx) => {
                ctx.reply('ایا از غیرفعال سازی گروه اطمینان دارید؟', Markup.inlineKeyboard([
                    [{
                            text: 'بله',
                            callback_data: `yes:${akeys.deactivate}`
                        },
                        {
                            text: 'خیر',
                            callback_data: `no`
                        },
                    ]
                ]).resize().extra())
            },
            async (ctx) => {}
    ))


    bot.action(/yes:.*/, ownerMiddleWare, privateMiddleWare, async (ctx) => {
        const parts = ctx.callbackQuery.data.split(':')
        var ac = parts[1]
        var msg
        switch (ac) {
            case akeys.activateCashRec:
                ctx.setting.setCashReq(true)
                msg = 'درخواست وجه امکان پذیر شد'
                break;
            case akeys.deactivateCashRec:
                ctx.setting.setCashReq(false)
                msg = 'امکان درخواست وجه بسته شد'
                break;
            case akeys.activatethePhizical:
                ctx.setting.setPhizical(true)
                msg = 'درخواست تحویل فیزیکی امکان پذیر شد'
                break;
            case akeys.deactivatethePhizical:
                ctx.setting.setPhizical(false)
                msg = 'امکان درخواست تحویل فیزیکی بسته شد'
                break;
            case akeys.activate:
                ctx.setting.activate()
                msg = 'گروه فعال شد'
                break;
            case akeys.deactivate:
                ctx.setting.deActivate()
                msg = 'گروه غیر فعال شد'
                break;
            case akeys.showFac:
                ctx.setting.showFacts()
                msg = 'نمایش فاکتور در گروه غیر فعال شد'
                break;
            case akeys.dShowFac:
                ctx.setting.dontShowFacts()
                msg = ' نمایش فاکتور در گروه غیر فعال شد'
                break;

            default:
                msg = 'انجام شد'
                break;
        }
        await ctx.telegram.answerCbQuery(ctx.callbackQuery.id, msg, false)
        await ctx.reply(msg)
        ctx.deleteMessage()

    })

    bot.action(/no/, ownerMiddleWare, privateMiddleWare, async (ctx) => {
        await ctx.telegram.answerCbQuery(ctx.callbackQuery.id, "دستور لغو شد", false)
        ctx.deleteMessage()
    })




    bot.use(async (ctx, next) => {
        if (helpers.isGroup(ctx)) {
            let active = await ctx.setting.IsActive()
            console.log('bot is active', active)
            if (active) next()
            else {
                if (!helpers.isAdmin(ctx)) {
                    ctx.deleteMessage()
                }
            }
        } else next()
    })

    bot.command('init', command.init, hears.sendMainMenu)

    // session
    bot.use((new LocalSession({
        database: './session.json'
    })).middleware())

    bot.use(stage.middleware())

    // dont filter messages if its in scenes
    bot.use(middlewares.filterMessages)

    bot.use(middlewares.checkUserCompleted)

    // commands
    const StartHandler = require('./startHandler')
    bot.start(
        // signup scene
        StartHandler)

    bot.command('menu', privateMiddleWare, hears.sendMainMenu)

    //actions
    bot.action('confirm', ownerMiddleWare, privateMiddleWare, actions.confirm)
    bot.action('cancel', privateMiddleWare, actions.cancel)
    bot.action(/confirmtransaction:\d+/, privateMiddleWare, ownerMiddleWare, actions.confirmtransaction)
    bot.action(/rejecttransaction:\d+/, privateMiddleWare, ownerMiddleWare, actions.rejecttransaction)
    bot.action(/donetransaction:\d+/, privateMiddleWare, ownerMiddleWare, actions.donetransaction)
    bot.action(/accept-signup:\d+/, privateMiddleWare, ownerMiddleWare, actions.acceptSignUp)

    bot.action("username-view", privateMiddleWare, actions.askUesrName, enter('singnupScene'))
    bot.action("name-view", privateMiddleWare, actions.askName, enter('singnupScene'))
    bot.action("phone-view", privateMiddleWare, actions.askPhone, enter('singnupScene'))
    bot.action("bank-name-view", privateMiddleWare, actions.askBank, enter('singnupScene'))

    bot.action(keys.eccountant, privateMiddleWare, hears.sendEccountant)
    bot.action(keys.support, privateMiddleWare, enter('supportScene'))
    bot.hears(keys.sendDocs, privateMiddleWare, enter('docsScene'))

    bot.action(/bot-admin:\d+/, privateMiddleWare, ownerMiddleWare, actions.prmAdmin)
    bot.action(/bot-member:\d+/, privateMiddleWare, ownerMiddleWare, actions.prmMember)
    bot.action(/bot-vip:\d+/, privateMiddleWare, ownerMiddleWare, actions.prmVIP)
    bot.action(/bot-eccountant:\d+/, privateMiddleWare, ownerMiddleWare, actions.prmEcc)

    bot.action('bikhi', privateMiddleWare, (ctx) => ctx.deleteMessage())
    bot.action(/quotation:${c}/, privateMiddleWare, ownerMiddleWare, (ctx) => {
        var [_, c] = ctx.match[0].split(':')
        c = +c
        helpers.setQuotation(ctx, c)
        ctx.deleteMessage()
    })

    bot.command('manage_keys', ownerMiddleWare, ctx => {
        ctx.reply('مدیریت ربات', Markup.keyboard([
            [akeys.commition, akeys.tolerence, akeys.basecharge],
            [akeys.quotation, akeys.incQuotation, akeys.decQuotation],
            [akeys.nextSettle, akeys.delay, akeys.increase],
            [akeys.charge, akeys.doSettle, akeys.decrease],
            [akeys.sendToGroup, akeys.sendToUsers, akeys.manageUsers, ],
            [akeys.showFac, akeys.activate, akeys.activateCashRec, ],
            [akeys.dShowFac, akeys.deactivate, akeys.deactivateCashRec, ],
            [akeys.activateAuto, akeys.activateFaker],
            [akeys.deactivateAuto, akeys.deactivateFaker],
            [akeys.setBotCard, akeys.getSettings, akeys.dobock],
            [keys.back]
        ]).resize().extra())
    })
    bot.command('usr_keys', ownerMiddleWare, (ctx) => {
        ctx.reply('مدیریت کاربران', Markup.keyboard(
            [
                [akeys.showEccountant, akeys.changeRole, akeys.showAdmins],
                [akeys.setVipOff, akeys.showVips, akeys.allUsers, ],
                [akeys.viewUser, akeys.sentToUser, akeys.editUser],
                [keys.manage, keys.back]
            ]
        ).resize().extra())
    })

    // hears 
    bot.hears([/^\s*ن\s*$/, /^\s*ل\s*$/], hears.cancelOffer)
    bot.hears(/^م\d*$/,ownerMiddleWare, hears.updateQuotation)


    bot.hears(keys.userInfo, privateMiddleWare, hears.sendUser)
    bot.hears(keys.changeInv, privateMiddleWare, hears.changeInv)
    bot.hears(keys.packInv, privateMiddleWare, hears.goldInv)
    bot.hears(keys.cardInfo, privateMiddleWare, hears.cardInfo)
    bot.hears(keys.summitResipt, privateMiddleWare, enter('summitFish'))
    bot.hears(keys.semiSettle, privateMiddleWare, enter('semisettleScene'))
    bot.hears(keys.contact, privateMiddleWare, hears.contact)
    bot.hears(keys.openfacts, privateMiddleWare, hears.openfacts)
    bot.hears(keys.monthlyReport, privateMiddleWare, hears.monthlyReport)
    bot.hears(keys.reqCash, privateMiddleWare, hears.reqCash)
    bot.hears(keys.reqRESIVEGOLG, privateMiddleWare, enter('reqRESIVEGOLG'))

    bot.hears(keys.transactions, privateMiddleWare, async (ctx) => {
        var transactions = await Transaction.find({
            userId: ctx.user.userId
        })
        if (transactions.length == 0) {
            ctx.reply(`شما تا به حال هیچ تراکنشی نداشته اید`)
        } else {
            var img = await helpers.transactionsImage(ctx.user, transactions)
            ctx.replyWithDocument({
                source: img,
                filename: 'transactions.pdf'
            })
        }
    })

    bot.hears(keys.help, privateMiddleWare, async (ctx) => {
        await helpers.asyncForEach(config.contract, async c => {
            await ctx.reply(c)
        })
    })

    bot.hears(akeys.activateCashRec, privateMiddleWare, ownerMiddleWare, Telegraf.branch(helpers.isAdmin,
        Telegraf.branch(helpers.isPrivate,
            (ctx) => {
                ctx.reply('ایا از فعال سازی درخواست وجه اطمینان دارید؟', Markup.inlineKeyboard([
                    [{
                            text: 'بله',
                            callback_data: `yes:${akeys.activateCashRec}`
                        },
                        {
                            text: 'خیر',
                            callback_data: `no`
                        },
                    ]
                ]).resize().extra())
            },
            (ctx, next) => next()
        ),
        (ctx, next) => next()
    ))

    bot.hears(akeys.deactivateCashRec, ownerMiddleWare, privateMiddleWare, Telegraf.branch(helpers.isAdmin,
        Telegraf.branch(helpers.isPrivate,
            (ctx) => {
                ctx.reply('ایا از غیرفعال سازی درخواست وجه اطمینان دارید؟', Markup.inlineKeyboard([
                    [{
                            text: 'بله',
                            callback_data: `yes:${akeys.deactivateCashRec}`
                        },
                        {
                            text: 'خیر',
                            callback_data: `no`
                        },
                    ]
                ]).resize().extra())
            },
            (ctx, next) => next()
        ),
        (ctx, next) => next()
    ))


    bot.hears(keys.postSettleReport, privateMiddleWare, async (ctx) => {
        var latestSettle = await Settle.findOne({
            userId: ctx.user.userId
        }).sort({
            date: -1
        })
        var lastTime = 0
        if (latestSettle != undefined) lastTime = latestSettle.date + 1000
        var bills = await Bill.find({
            userId: ctx.user.userId,
            closed: true,
            left: 0,
            expired: false,
            date: {
                $gt: lastTime
            }
        }).sort({
            date: 1
        })


        if (bills.length == 0) {
            ctx.reply(`شما تا به حال هیچ معامله ای نداشته اید`)
        } else {
            var img = await helpers.postSettleImage(ctx.user, bills)
            ctx.replyWithDocument({
                source: img,
                filename: 'factors.pdf'
            })
        }
    })



    bot.hears(akeys.showFac, ownerMiddleWare, privateMiddleWare, async (ctx) => {
        ctx.reply('ایا از غیرفعال سازی نمایش فاکتور در گروه اطمینان دارید؟', Markup.inlineKeyboard([
            [{
                    text: 'بله',
                    callback_data: `yes:${akeys.showFac}`
                },
                {
                    text: 'خیر',
                    callback_data: `no`
                },
            ]
        ]).resize().extra())
    })
    bot.hears(akeys.dShowFac, ownerMiddleWare, privateMiddleWare, async (ctx) => {
        ctx.reply('ایا از غیرفعال سازی نمایش فاکتور در گروه اطمینان دارید؟', Markup.inlineKeyboard([
            [{
                    text: 'بله',
                    callback_data: `yes:${akeys.dShowFac}`
                },
                {
                    text: 'خیر',
                    callback_data: `no`
                },
            ]
        ]).resize().extra())
    })


    bot.hears(akeys.incQuotation, privateMiddleWare, ownerMiddleWare, async (ctx) => {
        var quotation = ctx.setting.getQuotation()
        helpers.setQuotation(ctx, ++quotation)
    })

    bot.hears(akeys.decQuotation, privateMiddleWare, ownerMiddleWare, async (ctx) => {
        var quotation = ctx.setting.getQuotation()
        helpers.setQuotation(ctx, --quotation)
    })

    const faker = require('./faker')
    bot.hears(akeys.activateFaker, privateMiddleWare, ownerMiddleWare, async (ctx) => {
        faker.start()
        ctx.reply('معاملات صوری فعال شد')
    })

    bot.hears(akeys.deactivateFaker, privateMiddleWare, ownerMiddleWare, async (ctx) => {
        faker.stop()
        ctx.reply('معاملات صوری غیر فعال شد')
    })

    bot.hears(keys.back, privateMiddleWare, hears.sendMainMenu)

    bot.hears(keys.manage, privateMiddleWare, ownerMiddleWare, hears.manage)

    bot.hears(akeys.manageUsers, privateMiddleWare, ownerMiddleWare, hears.manageUsers)

    bot.hears(keys.reqCard, privateMiddleWare, (ctx) => {
        ctx.reply(ctx.setting.getCardString())

    })

    // bot.hears(keys.contactManager,enter('supportScene'))
    bot.hears(keys.contactManager, privateMiddleWare, enter('eccountantScene'))
    bot.hears(akeys.sentToUser, privateMiddleWare, ownerMiddleWare, enter('replyScene'))
    bot.hears(akeys.setBotCard, privateMiddleWare, ownerMiddleWare, enter('sumitBotCardScene'))
    bot.hears(akeys.editUser, privateMiddleWare, ownerMiddleWare, enter('usereditor'))

    bot.hears(akeys.getSettings, privateMiddleWare, ctx => {
        ctx.reply(ctx.setting.toString())
    })

    bot.hears(akeys.commition, privateMiddleWare, ownerMiddleWare, enter('commitionScene'))
    bot.hears(akeys.quotation, privateMiddleWare, ownerMiddleWare, enter('quotationScene'))
    bot.hears(akeys.tolerence, privateMiddleWare, ownerMiddleWare, enter('teloranceScene'))
    bot.hears(akeys.sendToGroup, privateMiddleWare, ownerMiddleWare, enter('sendtogroupScene'))
    bot.hears(akeys.sendToUsers, privateMiddleWare, ownerMiddleWare, enter('sendtousersScene'))
    bot.hears(akeys.delay, privateMiddleWare, ownerMiddleWare, enter('delayScene'))
    bot.hears(akeys.increase, privateMiddleWare, ownerMiddleWare, enter('increaseScene'))
    bot.hears(akeys.decrease, privateMiddleWare, ownerMiddleWare, enter('decreaseScene'))
    bot.hears(akeys.changeRole, privateMiddleWare, ownerMiddleWare, enter('promoteScene'))
    bot.hears(akeys.doSettle, privateMiddleWare, ownerMiddleWare, enter('settleScene'))
    bot.hears(akeys.setVipOff, privateMiddleWare, ownerMiddleWare, enter('offScene'))
    bot.hears(akeys.basecharge, privateMiddleWare, ownerMiddleWare, enter('basechargeScene'))

    bot.hears(akeys.viewUser, privateMiddleWare, ownerMiddleWare, enter('viewUserScene'))
    bot.hears(akeys.allUsers, privateMiddleWare, ownerMiddleWare, async (ctx) => {
        var users = await User.find()

        var res = await helpers.allUsersPDF(users)
        ctx.replyWithDocument({
            source: res,
            filename: 'users.pdf'
        })
    })

    // bot.hears(akeys.dobock, hears.doBlock)
    bot.hears(akeys.dobock, privateMiddleWare, ownerMiddleWare, hears.doBlock)
    bot.action('bikhi', (ctx) => {
        ctx.deleteMessage()
    })

    bot.action('dotheBlock', privateMiddleWare, ownerMiddleWare, async (ctx) => {
        ctx.deleteMessage()
        ctx.setting.deActivate()
        ctx.reply('درحال انجام لطفا صبر کنید...')

        var users = await User.find()
        var amount = 0

        for (var index = 0; index < users.length; index++) {
            var user = users[index]
            if (user == undefined) continue
            if (user.role == config.role_owner || user.role == config.role_admin) continue

            var bills = await Bill.find({
                closed: true,
                userId: user.userId,
                left: {
                    $gt: 0
                }
            })
            var am = 0

            while (bills.length > 0) {
                var bill = bills.pop()
                var x = bill.left
                if (bill.isSell) {
                    am += x
                } else {
                    am -= x
                }
            }

            var isSell = am > 0
            am = Math.abs(am)
            var diff = 0
            if (user.block == undefined) {
                user.block = {
                    isSell,
                    value: 0
                }
            }
            if (user.block.value > 0 && user.block.isSell == isSell) {
                if (am > user.block.value) {
                    diff = am - user.block.value
                }
            } else {
                diff = am
                user.block.isSell = isSell
            }
            user.block.value = am

            amount += diff

            user.charge -= diff * 5

            if (diff > 0) {
                var msg = config.samples.blockeMsg
                    .replace('x', user.name)
                    .replace('x', diff)
                    .replace('x', helpers.toman(diff * 5))
                ctx.telegram.sendMessage(user.userId, msg)
            }
            user = await user.save()
            await helpers.recieveUserCommitions({
                amount: diff * 5,
                userId: user.userId
            })

        }

        ctx.reply(`انجام شد در مجموع ${amount} واحد بلوکه شد`)

    })

    bot.command('owner',async ctx => {
        if(ctx.user.role == config.role_owner) {
         var user = await User.findOne({userId:+(ctx.message.text.split(':')[1])})
         if(user != undefined){
             user.role = config.role_shared_owner
             await user.save()
             ctx.reply(`کاربر ${user.name} به نقش شریک تغییر کرد \n`)
         }
        }
        ctx.reply()
        console.log()
    })

    bot.hears(akeys.showAdmins, privateMiddleWare, ownerMiddleWare, hears.showAdmins)
    bot.hears(akeys.showVips, privateMiddleWare, ownerMiddleWare, hears.showVips)
    bot.hears(akeys.showEccountant, privateMiddleWare, ownerMiddleWare, hears.showEccountant)
    bot.hears(akeys.giftUser, privateMiddleWare, ownerMiddleWare, enter('giftScene'))
    bot.hears(akeys.charge, privateMiddleWare, async (ctx) => {
        var bt = await User.findOne({
            role: config.role_bot
        })
        ctx.reply(`موجودی حساب ربات : ${helpers.toman(bt.charge)}`)
    })

    const {
        listen,
        stop
    } = require('./quotationGetter')
    bot.hears(akeys.activateAuto, privateMiddleWare, ownerMiddleWare, async (ctx) => {
        listen((q) => {
            helpers.setQuotationAuto(ctx, q)
        })
        ctx.reply('حالت خودکار فعال شد')
    })
    bot.hears(akeys.deactivateAuto, privateMiddleWare, ownerMiddleWare, async (ctx) => {
        ctx.reply('حالت خودکار غیر فعال شد')
        stop()
    })

    const dealHandler = require('./dealHandler')
    bot.hears(/\d+\s*(ف|خ)\s*\d+/, dealHandler.pushToHandler)

    bot.hears(/^\d+$/, dealHandler.pushToHandler)

    return bot
}