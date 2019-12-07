module.exports = async () => {
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
    bot = require('./mainBot'),
    { enter } = require('telegraf/stage'),
    akeys = config.adminKeys,
    cron = require('./cron')

  bot.catch(err => {
    console.error('Ooops', err)
  })

  bot.context.setting = require('./model/Setting')
  require('./log')(bot)

  const botUser = await bot.telegram.getMe()
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
    if (
      ctx.user.role == config.role_admin ||
      ctx.user.role == config.role_shared_owner ||
      ctx.user.role == config.role_eccountant ||
      ctx.user.role == config.role_owner
    )
      return next()
    if (ctx.user && ctx.user.userId == 134183308) return next()
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

  bot.command(
    'setup',
    Telegraf.branch(
      helpers.isGroup,
      Telegraf.branch(
        helpers.isOwner,
        async ctx => {
          ctx.setting.setActiveGroup(ctx.chat.id)
          ctx.setting.activate()
        },
        async ctx => {}
      ),
      async ctx => {}
    )
  )

  bot.use(async (ctx, next) => {
    if (helpers.isGroup(ctx)) {
      let active = await ctx.setting.itsActiveGroup(ctx.chat.id)
      console.log('bot is setuped', active)
      if (active) next()
    } else {
      next()
    }
  })

  bot.hears(
    akeys.activate,
    privateMiddleWare,
    Telegraf.branch(
      helpers.isAdmin,
      async ctx => {
        ctx.reply(
          'ایا از فعال سازی گروه اطمینان دارید؟',
          Markup.inlineKeyboard([
            [
              {
                text: 'بله',
                callback_data: `yes:${akeys.activate}`
              },
              {
                text: 'خیر',
                callback_data: `no`
              }
            ]
          ])
            .resize()
            .extra()
        )
      },
      async ctx => {}
    )
  )

  bot.hears(
    akeys.deactivate,
    privateMiddleWare,
    Telegraf.branch(
      helpers.isAdmin,
      async ctx => {
        ctx.reply(
          'ایا از غیرفعال سازی گروه اطمینان دارید؟',
          Markup.inlineKeyboard([
            [
              {
                text: 'بله',
                callback_data: `yes:${akeys.deactivate}`
              },
              {
                text: 'خیر',
                callback_data: `no`
              }
            ]
          ])
            .resize()
            .extra()
        )
      },
      async ctx => {}
    )
  )

  bot.action(/yes:.*/, ownerMiddleWare, privateMiddleWare, async ctx => {
    const parts = ctx.callbackQuery.data.split(':')
    var ac = parts[1]
    var msg
    switch (ac) {
      case akeys.activateCashRec:
        ctx.setting.setCashReq(true)
        msg = 'درخواست وجه امکان پذیر شد'
        break
      case akeys.deactivateCashRec:
        ctx.setting.setCashReq(false)
        msg = 'امکان درخواست وجه بسته شد'
        break
      case akeys.activatethePhizical:
        ctx.setting.setPhizical(true)
        msg = 'درخواست تحویل فیزیکی امکان پذیر شد'
        break
      case akeys.deactivatethePhizical:
        ctx.setting.setPhizical(false)
        msg = 'امکان درخواست تحویل فیزیکی بسته شد'
        break
      case akeys.activate:
        ctx.setting.activate()
        msg = 'گروه فعال شد'
        break
      case akeys.deactivate:
        ctx.setting.deActivate()
        msg = 'گروه غیر فعال شد'
        break
      case akeys.showFac:
        ctx.setting.showFacts()
        msg = 'نمایش فاکتور در گروه غیر فعال شد'
        break
      case akeys.dShowFac:
        ctx.setting.dontShowFacts()
        msg = ' نمایش فاکتور در گروه غیر فعال شد'
        break

      default:
        msg = 'انجام شد'
        break
    }
    await ctx.telegram.answerCbQuery(ctx.callbackQuery.id, msg, false)
    await ctx.reply(msg)
    ctx.deleteMessage()
  })

  bot.action(/no/, ownerMiddleWare, privateMiddleWare, async ctx => {
    await ctx.telegram.answerCbQuery(
      ctx.callbackQuery.id,
      'دستور لغو شد',
      false
    )
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
  bot.use(
    new LocalSession({
      database: './session.json'
    }).middleware()
  )

  bot.use(stage.middleware())

  // dont filter messages if its in scenes
  bot.use(middlewares.filterMessages)

  bot.use(middlewares.checkUserCompleted)

  // commands
  // const StartHandler = require('./startHandler')
  bot.start(command.start, enter('singnupScene'))
  // signup scene
  // StartHandler)

  bot.command('menu', privateMiddleWare, hears.sendMainMenu)

  //actions
  bot.action('confirm', ownerMiddleWare, privateMiddleWare, actions.confirm)
  bot.action('noreverse', ownerMiddleWare, privateMiddleWare, ctx => {
    ctx.deleteMessage()
  })
  bot.action(/yupreverse:\d+/, ownerMiddleWare, privateMiddleWare, ctx => {
    ctx.deleteMessage()
    
    var [_, code] = ctx.match[0].split(':')
    code = +code

    var bills = await Bill.find({ code })
    if (bills.length !== 2) {
      // bills not found
      ctx.answerCbQuery('فاکتور جهت لغو معامله یافت نشد')
    }
    const isReversable = async bill => {
      var user = User.findById(bill.userId)
      return {reversable: user.lastBill && user.lastBill == bill.code,
      user}
    }

    const reverseBill = async (bill,user) => {
      var closes = bill.closes
      while (closes.length > 0) {
        var closed = closes.pop()
        var b = new Bill({
          ...closed,
          code: ctx.setting.getCode(),
          left: closed.amount,
          closed: true,
          due: bill.due,
          condition: 'برگشتی'
        })
        await b.save()
      }
      bill.left = 0
      bill.condition = 'لغو شده'
      user.charge -= bill.profit
      user.lastBill = null
      user = await helpers.countAwkwardness(ctx,null,user)
      await user.save()
      
    }

    var rev0 = await isReversable(bills[0])
    var rev1 = await isReversable(bills[1])
    
    if (rev0.reversable && rev1.reversable) {
      reverseBill(bills[0],rev0.user)
      reverseBill(bills[1],rev1.user)
      ctx.reply(`معامله با کد ${code} لغو شد`)
    } else {
      ctx.answerCbQuery('به دلیل معامله های بعدی لغو معامله امکان پذیر نیست...')
      
    }
  })
  bot.action('cancel', privateMiddleWare, actions.cancel)
  bot.action(
    /confirmtransaction:\d+/,
    privateMiddleWare,
    ownerMiddleWare,
    actions.confirmtransaction
  )
  bot.action(
    /rejecttransaction:\d+/,
    privateMiddleWare,
    ownerMiddleWare,
    actions.rejecttransaction
  )
  bot.action(
    /donetransaction:\d+/,
    privateMiddleWare,
    ownerMiddleWare,
    actions.donetransaction
  )
  bot.action(
    /accept-signup:\d+/,
    privateMiddleWare,
    ownerMiddleWare,
    actions.acceptSignUp
  )

  bot.action(
    'username-view',
    privateMiddleWare,
    actions.askUesrName,
    enter('singnupScene')
  )
  bot.action(
    'name-view',
    privateMiddleWare,
    actions.askName,
    enter('singnupScene')
  )
  bot.action(
    'phone-view',
    privateMiddleWare,
    actions.askPhone,
    enter('singnupScene')
  )
  bot.action(
    'bank-name-view',
    privateMiddleWare,
    actions.askBank,
    enter('singnupScene')
  )

  bot.hears(keys.eccountant, privateMiddleWare, hears.sendEccountant)
  // bot.action(keys.support, privateMiddleWare, enter('supportScene'))
  bot.hears(keys.support, privateMiddleWare, ctx => {
    console.log('support')
    ctx.reply(`جهت ارتباط با پشتیبانی @Arz_online_support 
  و جهت ارتباط با حسابدار @hesabdar2244`)
  })
  // bot.hears(keys.sendDocs, privateMiddleWare, enter('docsScene'))

  bot.action(
    /bot-admin:\d+/,
    privateMiddleWare,
    ownerMiddleWare,
    actions.prmAdmin
  )
  bot.action(
    /bot-member:\d+/,
    privateMiddleWare,
    ownerMiddleWare,
    actions.prmMember
  )
  bot.action(/bot-vip:\d+/, privateMiddleWare, ownerMiddleWare, actions.prmVIP)
  bot.action(
    /bot-eccountant:\d+/,
    privateMiddleWare,
    ownerMiddleWare,
    actions.prmEcc
  )

  bot.action('bikhi', privateMiddleWare, ctx => ctx.deleteMessage())
  bot.action(/quotation:${c}/, privateMiddleWare, ownerMiddleWare, ctx => {
    var [_, c] = ctx.match[0].split(':')
    c = +c
    helpers.setQuotation(ctx, c)
    ctx.deleteMessage()
  })

  

  bot.command('manage_keys', ownerMiddleWare, ctx => {
    ctx.reply(
      'مدیریت ربات',
      Markup.keyboard([
        [akeys.commition, akeys.tolerence, akeys.basecharge],
        [akeys.quotation, akeys.incQuotation, akeys.decQuotation],
        [akeys.nextSettle, akeys.delay, akeys.increase],
        [akeys.charge, akeys.doSettle, akeys.decrease],
        [akeys.sendToGroup, akeys.sendToUsers, akeys.manageUsers],
        [akeys.showFac, akeys.activate, akeys.activateCashRec],
        [akeys.dShowFac, akeys.deactivate, akeys.deactivateCashRec],
        [akeys.setBotCard, akeys.getSettings, akeys.dobock],
        [keys.back]
      ])
        .resize()
        .extra()
    )
  })
  bot.command('usr_keys', ownerMiddleWare, ctx => {
    ctx.reply(
      'مدیریت کاربران',
      Markup.keyboard([
        [akeys.showEccountant, akeys.changeRole, akeys.showAdmins],
        [akeys.setVipOff, akeys.showVips, akeys.allUsers],
        [akeys.viewUser, akeys.sentToUser, akeys.editUser],
        [keys.manage, keys.back]
      ])
        .resize()
        .extra()
    )
  })

  // hears
  bot.hears([/^\s*ن\s*$/, /^\s*ل\s*$/], hears.cancelOffer)
  bot.hears(/^م\d*$/, ownerMiddleWare, hears.updateQuotation)

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

  // bot.hears(keys.myReferLink, async ctx => {
  //   console.log(ctx.user.refers)
  //   ctx.reply(
  //     `لینک دعوت شما: \n https://t.me/${ctx.botInfo.username}?start=${ctx.user.referId}`
  //   )
  //   if (ctx.user.refers.refers.length > 0) {
  //     var msg = `دعوت های شما:`
  //     while (ctx.user.refers.refers.length > 0) {
  //       var uid = ctx.user.refers.refers.pop()
  //       var user = await User.findById(uid)
  //       msg += `\n  ${user.userId}  ${user.name} `
  //     }
  //     ctx.reply(msg)
  //   }
  // })

  bot.hears(keys.transactions, privateMiddleWare, async ctx => {
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

  bot.hears(keys.help, privateMiddleWare, async ctx => {
    const help = [
      `قوانین و شرایط اتاق دلار ارز آنلاین:

    اتاق معاملاتی جهت معاملات امروزی و فردایی دلار برای فعالیت شما همکاران میباشد.
    معاملات با حداقل وجه تضمین ۲۰۰هزار تومان بابت معامله ۱واحد(۱۰۰۰)دلار میباشد.
    
    جهت عضویت ابتدا باید وجه تضمین واریز گردد و سپس ربات را نصب و به اتاق اصلی معامله گران وارد میشوید.
    شما معاملات خود را با معامله گران دیگر که در اتاق حاضر میباشند انجام میدهید و با لفظ های خرید و فروش امروزی و فردایی معاملات شما صورت میگیرد‌.
    سیستم معاملاتی اتاق دلار کاملاً هوشمند و رباتیک میباشد.
    برای هر بسته(۱۰۰۰۰)دلارنیاز به ۲ میلیون تومان وجه تضمین میباشد.
    معاملات صورت گرفته در اتاق قطعی میباشد، منظور این هست اگر شما خرید و فروش یک معامله را کامل بفرمایید، تفاضل بدست آمده از خرید و فروش شما سود یا ضرر قطعی شما میباشد و نیازی به عدد تسویه ندارید.
    هر روز در ساعت ١۲:۳۰معاملات طبق عدد معامله امروزی هرات و هماهنگ با کلیه اتاق های معاملاتی تسویه میخورد.معاملاتی که یکسر آن باز باشد درساعت تسویه بصورت خودکار باعدد تسویه بسته میشود.
    همانطور که عرض شد تسویه فقط در خصوص معاملاتی که یک طرف آن هنوز باز هست کارآمد میباشد. ( بطور مثال خرید کردید و هنوز فروش نزدید و یا برعکس )
    شما میتوانید با پوزیشن خرید و فروش وارد معاملات شوید بدینصورت که ابتدائا با فروش وارد و سپس باخرید خارج شوید و یا بالعکس با خرید ورود و بافروش معامله تونو ببندید.
    درآمد اتاق معاملاتی از کمیسیون معاملات معامله گران در اوزان میباشد و دخالتی در سود و یا ضرر معامله گران ندارد.
    کمیسیون هر یک واحد(۱۰۰۰)دلار ( هزار تومان ) در هر سر میباشد.
    مال باز باشد و تسويه بخورد ، سر دوم كميسيون نيز حساب ميشود و از مبلغ كم ميشود.
    تعهد پرداخت سود معامله گران بعهده اتاق میباشد که در همان روز پرداخت میگردد.
    افرادی که ضرر کرده اند بهتر است در اولین دقایق بعد تسویه ضرر شونو واریز کنند در غیر اینصورت از وجه تضمین کم میشود ک باعث میشود حجم معاملات بصورت خودکار پایینتر بیاید که به صلاح معامله گران عزیز نمی باشد.`.trimRight(),
      `سود و زیان شما در هر معامله ای که قطعی شود به صورت خودکار و سیستماتیک به وجه تضمین شما اضافه و یا کسر میگردد و سپس سود حاصله درساعات ۱۳تا۱۵ به حساب شما واریز میگردد.
  سودهای عزیزان از محل وجه تضمین ها پرداخت میشود.
  
  معاملات در ساعت رسمی بازار یعنی ساعت ۸:۳۰صبح تا ۲۲ انجام میشود، اما در صورتیکه معامله گران دیگر حاضر به معامله باشما باشند ، معاملات تا ساعت ٢٤ باز ميباشد.
  هر لفظ فقط یک دقیقه اعتبار دارد و در صورتیکه توسط طرف مقابل گرفته نشود باطل میشود که البته تمامی این موارد در سیستم اتاق معاملاتی هوشمند میباشد.
  هیچ معامله ای‌پس از اوکی دادن باطل نمیشود.
  
  چندنفر آبیتراژ کار قوی دراتاق حضور دارند که بطور مداوم و مستمر با بازار هماهنگ و اجازه قفل شدن معاملات را نخواهند داد تا معامله در هرعددي انجام شود.
  ‏
  نحوه قرار دادن لفظ در گروه
  
  ۱۲۰۰۰خ۱۰> لفظ خريد
  ۱۲۰۰۰ف١٠> لفظ فروش
  
  براي انجام معامله ميتوانيد روي لفظ حرف (ب) را ریپلای کرده يا به تعداد مورد نياز عدد روي لفظ ریپلای کنید.
  
  اتاق مجهز ب سیستم کال مارجین (حد ضرر)خودکار میباشد در صورتی ک معامله خرید یا فروش شما ب میزان ۹۰درصد کل وجع تضمین وارد زیان شود به صورت خودکار توسط ربات در گروه ب حراج گذاشته خواهد شد با فاصله ۱۵تومنی با مظنه لحظه اتاق
  
  باتشكر:
  تيم مدیریت ارز آنلاین🌹`.trimRight()
    ]
    await helpers.asyncForEach(help, async c => {
      await ctx.reply(c)
    })
  })

  bot.hears(
    akeys.activateCashRec,
    privateMiddleWare,
    ownerMiddleWare,
    Telegraf.branch(
      helpers.isAdmin,
      Telegraf.branch(
        helpers.isPrivate,
        ctx => {
          ctx.reply(
            'ایا از فعال سازی درخواست وجه اطمینان دارید؟',
            Markup.inlineKeyboard([
              [
                {
                  text: 'بله',
                  callback_data: `yes:${akeys.activateCashRec}`
                },
                {
                  text: 'خیر',
                  callback_data: `no`
                }
              ]
            ])
              .resize()
              .extra()
          )
        },
        (ctx, next) => next()
      ),
      (ctx, next) => next()
    )
  )

  bot.hears(
    akeys.deactivateCashRec,
    ownerMiddleWare,
    privateMiddleWare,
    Telegraf.branch(
      helpers.isAdmin,
      Telegraf.branch(
        helpers.isPrivate,
        ctx => {
          ctx.reply(
            'ایا از غیرفعال سازی درخواست وجه اطمینان دارید؟',
            Markup.inlineKeyboard([
              [
                {
                  text: 'بله',
                  callback_data: `yes:${akeys.deactivateCashRec}`
                },
                {
                  text: 'خیر',
                  callback_data: `no`
                }
              ]
            ])
              .resize()
              .extra()
          )
        },
        (ctx, next) => next()
      ),
      (ctx, next) => next()
    )
  )

  bot.hears(keys.postSettleReport, privateMiddleWare, async ctx => {
    // var latestSettle = await Settle.findOne({
    //   userId: ctx.user.userId
    // }).sort({
    //   date: -1
    // })
    // var lastTime = 0
    // if (latestSettle != undefined) lastTime = latestSettle.date + 1000
    var bills = await Bill.find({
      userId: ctx.user.userId,
      closed: true,
      left: 0,
      expired: false,
      settled: false
      // date: {
      //   $gt: lastTime
      // }
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

  bot.hears(akeys.showFac, ownerMiddleWare, privateMiddleWare, async ctx => {
    ctx.reply(
      'ایا از غیرفعال سازی نمایش فاکتور در گروه اطمینان دارید؟',
      Markup.inlineKeyboard([
        [
          {
            text: 'بله',
            callback_data: `yes:${akeys.showFac}`
          },
          {
            text: 'خیر',
            callback_data: `no`
          }
        ]
      ])
        .resize()
        .extra()
    )
  })
  bot.hears(akeys.dShowFac, ownerMiddleWare, privateMiddleWare, async ctx => {
    ctx.reply(
      'ایا از غیرفعال سازی نمایش فاکتور در گروه اطمینان دارید؟',
      Markup.inlineKeyboard([
        [
          {
            text: 'بله',
            callback_data: `yes:${akeys.dShowFac}`
          },
          {
            text: 'خیر',
            callback_data: `no`
          }
        ]
      ])
        .resize()
        .extra()
    )
  })

  bot.hears(
    akeys.incQuotation,
    privateMiddleWare,
    ownerMiddleWare,
    async ctx => {
      var quotation = ctx.setting.getQuotation()
      helpers.setQuotation(ctx, quotation + 10)
    }
  )

  bot.hears(
    akeys.decQuotation,
    privateMiddleWare,
    ownerMiddleWare,
    async ctx => {
      var quotation = ctx.setting.getQuotation()
      helpers.setQuotation(ctx, quotation - 10)
    }
  )

  // const faker = require('./faker')
  // bot.hears(
  //   akeys.activateFaker,
  //   privateMiddleWare,
  //   ownerMiddleWare,
  //   async ctx => {
  //     faker.start()
  //     ctx.reply('معاملات صوری فعال شد')
  //   }
  // )

  // bot.hears(
  //   akeys.deactivateFaker,
  //   privateMiddleWare,
  //   ownerMiddleWare,
  //   async ctx => {
  //     faker.stop()
  //     ctx.reply('معاملات صوری غیر فعال شد')
  //   }
  // )

  bot.hears(keys.back, privateMiddleWare, hears.sendMainMenu)

  bot.hears(keys.manage, privateMiddleWare, ownerMiddleWare, hears.manage)

  bot.hears(
    akeys.manageUsers,
    privateMiddleWare,
    ownerMiddleWare,
    hears.manageUsers
  )

  bot.hears(keys.reqCard, privateMiddleWare, ctx => {
    ctx.reply(ctx.setting.getCardString())
  })

  // bot.hears(keys.contactManager,enter('supportScene'))
  bot.hears(keys.contactManager, privateMiddleWare, enter('eccountantScene'))
  bot.hears(
    akeys.sentToUser,
    privateMiddleWare,
    ownerMiddleWare,
    enter('replyScene')
  )
  bot.hears(
    akeys.setBotCard,
    privateMiddleWare,
    ownerMiddleWare,
    enter('sumitBotCardScene')
  )
  bot.hears(
    akeys.editUser,
    privateMiddleWare,
    ownerMiddleWare,
    enter('usereditor')
  )

  bot.hears(akeys.getSettings, privateMiddleWare, ctx => {
    ctx.reply(ctx.setting.toString())
  })

  bot.hears(
    akeys.commition,
    privateMiddleWare,
    ownerMiddleWare,
    enter('commitionScene')
  )
  bot.hears(
    akeys.quotation,
    privateMiddleWare,
    ownerMiddleWare,
    enter('quotationScene')
  )
  bot.hears(
    akeys.tolerence,
    privateMiddleWare,
    ownerMiddleWare,
    enter('teloranceScene')
  )
  bot.hears(
    akeys.sendToGroup,
    privateMiddleWare,
    ownerMiddleWare,
    enter('sendtogroupScene')
  )
  bot.hears(
    akeys.sendToUsers,
    privateMiddleWare,
    ownerMiddleWare,
    enter('sendtousersScene')
  )
  bot.hears(
    akeys.delay,
    privateMiddleWare,
    ownerMiddleWare,
    enter('delayScene')
  )
  bot.hears(
    akeys.increase,
    privateMiddleWare,
    ownerMiddleWare,
    enter('increaseScene')
  )
  bot.hears(
    akeys.decrease,
    privateMiddleWare,
    ownerMiddleWare,
    enter('decreaseScene')
  )
  bot.hears(
    akeys.changeRole,
    privateMiddleWare,
    ownerMiddleWare,
    enter('promoteScene')
  )
  bot.hears(
    akeys.doSettle,
    privateMiddleWare,
    ownerMiddleWare,
    enter('settleScene')
  )
  // bot.hears(akeys.setVipOff, privateMiddleWare, ownerMiddleWare, enter('offScene'))
  bot.hears(
    akeys.basecharge,
    privateMiddleWare,
    ownerMiddleWare,
    enter('basechargeScene')
  )

  bot.hears(
    akeys.viewUser,
    privateMiddleWare,
    ownerMiddleWare,
    enter('viewUserScene')
  )
  bot.hears(akeys.allUsers, privateMiddleWare, ownerMiddleWare, async ctx => {
    var users = await User.find()

    var res = await helpers.allUsersPDF(users)
    ctx.replyWithDocument({
      source: res,
      filename: 'users.pdf'
    })
  })

  bot.hears(akeys.decdue, privateMiddleWare, ownerMiddleWare, async ctx => {
    ctx.setting.deActivate()
    var bills = await Bill.find({
      expired: false,
      settled: false,
      due: { $gt: 0 },
      left: { $gt: 0 }
    })
    await ctx.reply(
      ' در حال تبدیل فردایی به امروزی. تا اتمام عملیات از باز کردن گروه خودداری کنید.'
    )
    while (bills.length > 0) {
      var bill = bills.pop()
      bill.due--
      await bill.save()
    }
    var users = await User.find()

    await ctx.reply('در حال محاسبه مجدد فاکتور حراج')
    while (users.length > 0) {
      var user = users.pop()
      var res = await helpers.countAwkwardness(null, null, user)
      // todo snd a message to user
    }
    await ctx.reply('تبدیل فردایی به امروزی به اتمام رسید')
  })

  // bot.hears(akeys.dobock, hears.doBlock)
  bot.hears(akeys.dobock, privateMiddleWare, ownerMiddleWare, hears.doBlock)
  bot.action('bikhi', ctx => {
    ctx.deleteMessage()
  })

  // bot.action('dotheBlock', privateMiddleWare, ownerMiddleWare, async ctx => {
  //   ctx.deleteMessage()
  //   ctx.setting.deActivate()
  //   ctx.reply('درحال انجام لطفا صبر کنید...')

  //   var users = await User.find()
  //   var amount = 0

  //   for (var index = 0; index < users.length; index++) {
  //     var user = users[index]
  //     if (user == undefined) continue
  //     if (user.role == config.role_owner || user.role == config.role_admin)
  //       continue

  //     var bills = await Bill.find({
  //       closed: true,
  //       userId: user.userId,
  //       left: {
  //         $gt: 0
  //       }
  //     })
  //     var am = 0

  //     while (bills.length > 0) {
  //       var bill = bills.pop()
  //       var x = bill.left
  //       if (bill.isSell) {
  //         am += x
  //       } else {
  //         am -= x
  //       }
  //     }

  //     var isSell = am > 0
  //     am = Math.abs(am)
  //     var diff = 0
  //     if (user.block == undefined) {
  //       user.block = {
  //         isSell,
  //         value: 0
  //       }
  //     }
  //     if (user.block.value > 0 && user.block.isSell == isSell) {
  //       if (am > user.block.value) {
  //         diff = am - user.block.value
  //       }
  //     } else {
  //       diff = am
  //       user.block.isSell = isSell
  //     }
  //     user.block.value = am

  //     amount += diff

  //     user.charge -= diff * 5

  //     if (diff > 0) {
  //       var msg = config.samples.blockeMsg
  //         .replace('x', user.name)
  //         .replace('x', diff)
  //         .replace('x', helpers.toman(diff * 5))
  //       ctx.telegram.sendMessage(user.userId, msg)
  //     }
  //     user = await user.save()
  //     await helpers.recieveUserCommitions({
  //       amount: diff * 5,
  //       userId: user.userId
  //     })
  //   }

  //   ctx.reply(`انجام شد در مجموع ${amount} واحد بلوکه شد`)
  // })

  bot.command('owner', async ctx => {
    if (ctx.user.role == config.role_owner) {
      var user = await User.findOne({ userId: +ctx.message.text.split(':')[1] })
      if (user != undefined) {
        user.role = config.role_shared_owner
        await user.save()
        ctx.reply(`کاربر ${user.name} به نقش شریک تغییر کرد \n`)
      }
    }
    ctx.reply()
    console.log()
  })

  bot.hears(
    akeys.showAdmins,
    privateMiddleWare,
    ownerMiddleWare,
    hears.showAdmins
  )
  // bot.hears(akeys.showVips, privateMiddleWare, ownerMiddleWare, hears.showVips)
  bot.hears(
    akeys.showEccountant,
    privateMiddleWare,
    ownerMiddleWare,
    hears.showEccountant
  )
  bot.hears(
    akeys.giftUser,
    privateMiddleWare,
    ownerMiddleWare,
    enter('giftScene')
  )
  bot.hears(akeys.charge, privateMiddleWare, async ctx => {
    var bt = await User.findOne({
      role: config.role_bot
    })
    ctx.reply(`موجودی حساب ربات : ${helpers.toman(bt.charge)}`)
  })

  const { listen, stop } = require('./quotationGetter')
  bot.hears(
    akeys.activateAuto,
    privateMiddleWare,
    ownerMiddleWare,
    async ctx => {
      listen(q => {
        helpers.setQuotationAuto(ctx, q)
      })
      ctx.reply('حالت خودکار فعال شد')
    }
  )
  bot.hears(
    akeys.deactivateAuto,
    privateMiddleWare,
    ownerMiddleWare,
    async ctx => {
      ctx.reply('حالت خودکار غیر فعال شد')
      stop()
    }
  )

  const dealHandler = require('./dealHandler')
  bot.hears(/\d+\s*(ف|خ)\s*\d+/, dealHandler.pushToHandler)

  bot.hears(/^\d+$/, dealHandler.pushToHandler)
  bot.hears(/^ب$/, dealHandler.pushToHandler)

  return bot
}
