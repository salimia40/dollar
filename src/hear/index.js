const Telegraf = require('telegraf')
const helpers = require('../helpers')
const moment = require('moment')
const queue = require('../queue')
const Transaction = require('../model/Transaction')
const Settle = require('../model/Settle')
const Commition = require('../model/Commition')
const faker = require('../faker')

const Bill = require('../model/Bill')
const User = require('../model/User')
const config = require('../config')
const { keys } = config
const akeys = config.adminKeys

const Markup = require('telegraf/markup')

const { enter } = require('telegraf/stage')

const OwnerOnlyMsg = 'این دستور تنها برای مالک ربات قابل اجرا می باشد'

const OwnerOnly = fn =>
  Telegraf.branch(helpers.isOwner, fn, ctx => {
    console.log('not owner')
    ctx.telegram.sendMessage(ctx.message.from.id, OwnerOnlyMsg)
    ctx.deleteMessage()
  })
const AdminOnly = fn =>
  Telegraf.branch(helpers.isAdmin, fn, ctx => {
    console.log('not owner')
    ctx.telegram.sendMessage(ctx.message.from.id, OwnerOnlyMsg)
    ctx.deleteMessage()
  })

module.exports = {
  updateQuotation: AdminOnly(async ctx => {
    var v = ctx.match[0].slice(1)
    v = +v
    helpers.setQuotation(ctx, v)
    try {
      ctx.deleteMessage()
    } catch (error) {
      //
    }
  }),
  updateBaseCharge: OwnerOnly(async ctx => {
    var [t, i, v] = ctx.match[0].split(' ')
    await ctx.setting.setBaseCharge(+v)
    ctx.reply(`وجه تضمین: ${v}`)
    ctx.deleteMessage()
  }),
  updateCommition: AdminOnly(async ctx => {
    var [t, v] = ctx.match[0].split(' ')
    await ctx.setting.setCommition(+v)
    ctx.reply(`کمیسیون: ${v}`)
    ctx.deleteMessage()
  }),
  updateTolelrance: AdminOnly(async ctx => {
    var [t, v] = ctx.match[0].split(' ')
    await ctx.setting.setTolerence(+v)
    ctx.reply(`تلورانس: ${v}`)
    ctx.deleteMessage()
  }),
  openfacts: async ctx => {
    let opfs = await Bill.find({
      userId: ctx.user.userId,
      closed: true,
      left: {
        $gt: 0
      }
    })
    if (opfs.length == 0) {
      ctx.reply('شما در حال حاظر فاکتور بازی ندارید')
    } else {
      ctx.reply('درخواست با موفقیت ارسال شد لطفا منتظر بمانید')

      let p = await helpers.opfImage(ctx, opfs)
      ctx.replyWithPhoto({
        source: p
      })
    }
  },
  monthlyReport: async ctx => {
    ctx.reply('درخواست با موفقیت ارسال شد لطفا منتظر بمانید')
    var amonth = 1000 * 60 * 60 * 24 * 30
    var amonthAgo = Date.now() - amonth
    var settles = await Settle.find({
      userId: ctx.user.userId,
      date: {
        $gt: amonthAgo
      }
    })

    var res = await helpers.monthlyReportImage(settles, ctx.user)
    ctx.replyWithDocument({
      source: res,
      filename: 'mr.pdf'
    })
  },
  sendUser: async ctx => {
    let msg = await helpers.userToString(ctx)
    ctx.reply(msg, {
      reply_markup: {
        inline_keyboard: [
          // [{
          //     text: 'ویرایش نام',
          //     callback_data: 'name-view'
          // }],
          // [{
          //     text: 'ویرایش نام کاربری',
          //     callback_data: 'username-view'
          // }],
          // [{
          //     text: 'ویرایش شماره تماس',
          //     callback_data: 'phone-view'
          // }],
          [
            {
              text: 'ویرایش حساب بانکی',
              callback_data: 'bank-name-view'
            }
          ]
        ]
      }
    })
  },
  chargeUser: Telegraf.branch(
    helpers.isPrivate,
    OwnerOnly(async ctx => {
      console.log('called')
      /**
       * charge a user
       * todo ask for confirm
       */
      let [c, userId, charge] = ctx.match[0].split(' ')
      userId = +userId
      charge = +charge

      let user = await User.findOne({
        userId
      })
      if (user == undefined) {
        return ctx.reply('کاربر یافت نشد')
      }

      let res = await ctx.reply(
        `do you confirm to charge ${userId}:${user.name} with ${charge}?`,
        Markup.inlineKeyboard([
          [
            {
              text: 'تایید',
              callback_data: 'confirm'
            },
            {
              text: 'انصراف',
              callback_data: 'cancel'
            }
          ]
        ])
          .resize()
          .extra()
      )
      ctx.session.state = JSON.stringify({
        action: 'charge',
        amount: charge,
        userId: userId,
        message_id: res.message_id
      })
    }),
    ctx => {
      ctx.telegram.sendMessage(
        ctx.message.from.id,
        'این دستور تنها در چت خصوصی قابل اجرا می باشد'
      )
      ctx.deleteMessage()
    }
  ),
  sendEccountant: ctx => {
    // ctx.telegram.deleteMessage(
    //   ctx.callbackQuery.message.chat.id,
    //   ctx.callbackQuery.message.message_id
    // )
    ctx.reply(
      'عملیات مورد نظر را انتخاب کنید:',
      Markup.keyboard([
        [keys.summitResipt, keys.reqCash],
        [keys.reqCard, keys.cardInfo],
        [keys.transactions, keys.help],
        [keys.back, keys.support],
      ])
        .resize()
        .extra()
    )
  },
  sendMainMenu: ctx => {
    console.log('called')
    let btns = [
      [keys.openfacts, keys.monthlyReport],
      [keys.postSettleReport, keys.semiSettle],
      [keys.packInv, keys.changeInv],
      [keys.userInfo, keys.help],
      [keys.eccountant]
    ]
    if (
      ctx.user.role == config.role_owner ||
      ctx.user.role == config.role_admin ||
      ctx.user.role == config.role_eccountant ||
      ctx.user.role == config.role_shared_owner
    ) {
      btns.push([keys.manage])
    }
    ctx.reply(
      'منوی اصلی:',
      Markup.keyboard(btns)
        .resize()
        .extra()
    )
  },

  reqCash: Telegraf.branch(
    ctx => {
      //friday is 5
      return ctx.setting.getCashReq()
      // return true
    },
    enter('cashReq'),
    ctx => {
      ctx.reply(
        `❌درخواست وجه فقط در روزهای جمعه از ساعت 9 الی 20 امکان پذیر می باشد.`
      )
    }
  ),

  contact: ctx => {
    ctx.reply(
      'معامله گر گرامی با توجه به نیاز خود یکی از بخش های زیر را برای دریافت خدمات و راهتمایی اتنخاب کنید',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: keys.support,
                callback_data: keys.support
              }
            ],
            [
              {
                text: keys.eccountant,
                callback_data: keys.eccountant
              }
            ]
          ]
        }
      }
    )
  },

  cardInfo: ctx => {
    ctx.reply(
      `
        💳 شماره کارت شما ${ctx.user.bank.number}

        🏦 نام بانک: ${ctx.user.bank.name}
        `,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'ویرایش',
                callback_data: 'bank-name-view'
              }
            ]
          ]
        }
      }
    )
  },
  goldInv: async ctx => {
    let bills = await Bill.find({
      userId: ctx.message.from.id,
      isSell: false,
      closed: true,
      left: {
        $gt: 0
      }
    })
    let count = 0

    for (var i = 0; i < bills.length; i++) {
      count += bills[i].left
    }

    if (count == 0) {
      bills = await Bill.find({
        userId: ctx.message.from.id,
        isSell: true,
        closed: true,
        left: {
          $gt: 0
        }
      })

      await helpers.asyncForEach(bills, bill => {
        count += bill.left
      })
      count = 0 - count
    }
    var msg
    if (count < 0) {
      msg = `${Math.abs(count)}  واحد فروش`
    } else if (count == 0) {
      msg = `صفر واحد`
    } else msg = `${Math.abs(count)}  واحد خرید`

    var es =
      count < 0 ? await helpers.maxCanSell(ctx) : await helpers.maxCanBuy(ctx)

    // var mcb = Math.floor(ctx.user.charge / ctx.setting.getBaseCharge())
    msg += `\n موجودی آزاد ${es} واحد`

    ctx.reply(msg)
  },

  changeInv: ctx => {
    if (
      ctx.user.gift == undefined ||
      ctx.user.gift.activated == true ||
      ctx.user.gift.charge == 0
    ) {
      let msg = `موجودی ${helpers.toman(ctx.user.charge)} تومان`
      ctx.reply(msg)
    } else {
      var charge = ctx.user.charge
      var gift = ctx.user.gift.charge
      var pickable = ctx.user.gift.activated ? charge + gift : charge
      var activatedMsg = ctx.user.gift.activated
        ? `\n ${helpers.toman(gift)} تومان اعتبار هدیه شما فعال نشده است`
        : ''
      var msg = `موجودی ${helpers.toman(charge)} تومان
موجودی قابل برداشت ${helpers.toman(pickable)}`
      msg += activatedMsg
      ctx.reply(msg)
    }
  },
  manage: async ctx => {
    switch (ctx.user.role) {
      case config.role_owner:
      case config.role_shared_owner:
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
            [akeys.activateAuto, akeys.deactivateAuto],
            [akeys.setBotCard, akeys.getSettings],
            [akeys.decdue],
            [keys.back]
          ])
            .resize()
            .extra()
        )
        break

      case config.role_admin:
        ctx.reply(
          'مدیریت ربات',
          Markup.keyboard([
            [akeys.quotation, akeys.incQuotation, akeys.decQuotation],
            [akeys.sendToGroup, akeys.sendToUsers, akeys.getSettings],
            [akeys.activate, akeys.deactivate],
            [akeys.activateAuto, akeys.deactivateAuto],
            [akeys.allUsers],
            [keys.back]
          ])
            .resize()
            .extra()
        )
        break
      case config.role_eccountant:
        ctx.reply(
          'مدیریت ربات',
          Markup.keyboard([
            [akeys.quotation, akeys.incQuotation, akeys.decQuotation],
            [akeys.sendToGroup, akeys.sendToUsers, akeys.getSettings],
            [akeys.activate, akeys.deactivate, akeys.manageUsers],
            [akeys.activateAuto, akeys.deactivateAuto],
            [keys.back]
          ])
            .resize()
            .extra()
        )
        break
    }
  },
  manageUsers: async ctx => {
    ctx.reply(
      'مدیریت کاربران',
      Markup.keyboard([
        [akeys.showEccountant, akeys.changeRole, akeys.showAdmins],
        [akeys.allUsers, akeys.viewUser],
        [akeys.sentToUser, akeys.editUser],
        [keys.manage, keys.back]
      ])
        .resize()
        .extra()
    )
  },
  doBlock: Telegraf.branch(
    helpers.isOwner,
    async ctx => {
      ctx.reply(
        'آیا از انجام بلوکه اطمینان دارید؟',
        Markup.inlineKeyboard([
          [
            {
              text: 'انجامش بده',
              callback_data: 'dotheBlock'
            },
            {
              text: 'بیخیال',
              callback_data: 'bikhi'
            }
          ]
        ])
          .resize()
          .extra()
      )
    },
    () => {}
  ),
  showAdmins: async ctx => {
    var users = await User.find({
      role: config.role_admin
    })
    if (users.length == 0) {
      ctx.reply('در حال حاظر مدیری یافت نشد')
    } else {
      var i = 0
      var msg = ''
      helpers.asyncForEach(users, async user => {
        msg += `${user.userId}\t\t${user.name}`
        i++
        if (i > 10) {
          ctx.reply(msg)
          i = 0
          msg = ''
        }
      })
      if (i > 0) {
        ctx.reply(msg)
      }
    }
  },
  showVips: async ctx => {
    var users = await User.find({
      role: config.role_vip
    })
    if (users.length == 0) {
      ctx.reply('در حال حاظر vip  یافت نشد')
    } else {
      var i = 0
      var msg = ''
      helpers.asyncForEach(users, async user => {
        msg += `${user.userId}\t\t${user.name}`
        i++
        if (i > 10) {
          ctx.reply(msg)
          i = 0
          msg = ''
        }
      })
      if (i > 0) {
        ctx.reply(msg)
      }
    }
  },
  showEccountant: async ctx => {
    var user = await User.findOne({
      role: config.role_eccountant
    })
    if (user == undefined) {
      ctx.reply('در حال حاظر حسابداری یافت نشد')
    } else {
      var msg = ''
      msg += `${user.userId}\t\t${user.name}`
      ctx.reply(msg)
    }
  },
  cancelOffer: async (ctx, next) => {
    if (helpers.isGroup(ctx) && helpers.isReply(ctx)) {
      try {
        ctx.deleteMessage()
      } catch (error) {
        //
      }
      let bill = await Bill.findOne({
        messageId: ctx.message.reply_to_message.message_id
      })
      // console.log(bill)
      if (bill == undefined) return next()
      if (bill.userId != ctx.user.userId) return next()

      if (!bill.closed && !bill.expired) {
        bill.expired = true
        bill.save()
        ctx.telegram.deleteMessage(ctx.chat.id, bill.messageId)
      } else return next()
      /**
       * next block can be used in case wanting it cancel all offers in once
       */
      // }
      // else if (helpers.isGroup(ctx)) {
      //     var bills = await Bill.find({
      //         userId: ctx.user.userId,
      //         expired: false,
      //         closed: false,
      //     })
      //     for (let index = 0; index < bills.length; index++) {
      //         const bill = bills[index]
      //         if (bill == undefined) continue
      //         bill.expired = true
      //         await bill.save()
      //     }
      //     ctx.telegram.sendMessage(ctx.user.userId, 'همه لفظ های شما باطل شد')
    } else return next()
  },
  validateOffer: async (ctx, next) => {
    var { amount, isSell, price, type } = ctx.lafz

    let mx = await helpers.maxCanSell(ctx, false)
    let mcb = await helpers.maxCanBuy(ctx, false)

    let mt = helpers.matchTolerance(price, 0)
    console.log(mt)
    let bc =
      ctx.user.config.baseCharge == -1
        ? ctx.setting.getBaseCharge()
        : ctx.user.config.baseCharge
    if (ctx.user.charge < bc) {
      return ctx.telegram.sendMessage(
        ctx.message.from.id,
        'موجودی حساب شما کمتر از وجه تضمین است'
      )
    }
    if (!isSell && amount > mcb) {
      return ctx.telegram.sendMessage(
        ctx.message.from.id,
        'شما به حد اکثر میزان توانایی خرید خود رسیده اید\n اکانت خود را شارژ کرده'
      )
    }
    if (isSell && amount > mx) {
      return ctx.telegram.sendMessage(
        ctx.message.from.id,
        'شما به حد اکثر میزان توانایی فروش خود رسیده اید\n اکانت خود را شارژ کرده'
      )
    }
    if (!helpers.isComplete(ctx)) {
      return ctx.telegram.sendMessage(
        ctx.message.from.id,
        'لطفا ابتدا حساب خود را تکمیل نمایید'
      )
    }
    if (!helpers.isGroup(ctx)) {
      return ctx.telegram.sendMessage(
        ctx.message.from.id,
        'این دستور تنها در گروه قابل اجرا می باشد'
      )
    }
    if (!mt) {
      let msg = 'قیمت وارد شما شما خارج از محدوده مجاز قیمت دهی می باشد'
      let tol = await ctx.setting.getTolerance()
      let q = await ctx.setting.getQuotation()
      let min = q - tol
      let max = q + tol
      msg += '\n\n'
      msg += `محدوده مجاز قیمت دهی \n\n ${min} الی ${max} `
      return ctx.telegram.sendMessage(ctx.message.from.id, msg)
    }
    next()
  },
  prossessOffer: async (ctx, next) => {
    var { amount, isSell, price, type, due } = ctx.lafz
    var bill

    // if (helpers.isReply(ctx)) {
    //   bill = await Bill.findOne({
    //     messageId: ctx.message.reply_to_message.message_id
    //   })
    //   if (bill != undefined && !bill.closed) {
    //     if (
    //       (bill.isSell != isSell &&
    //         bill.amount >= amount &&
    //         bill.price == price &&
    //         !bill.sellAsWhole) ||
    //       (bill.isSell != isSell &&
    //         bill.amount == amount &&
    //         bill.price == price &&
    //         bill.sellAsWhole)
    //     ) {
    //       let sellerId, buyerId
    //       if (isSell) {
    //         sellerId = ctx.state.user.userId
    //         buyerId = bill.userId
    //       } else {
    //         buyerId = ctx.state.user.userId
    //         sellerId = bill.userId
    //       }
    //       ctx.values = {
    //         isSell,
    //         sellerId,
    //         buyerId,
    //         amount,
    //         price,
    //         bill
    //       }
    //       //make a deal
    //       next()
    //     } else {
    //       console.log('they dont match')
    //     }
    //   } else {
    //     console.log('offer is over')
    //   }
    // } else {
    // find matching offers and close deal

    let c = await ctx.setting.getCode()
    bill = new Bill({
      code: c,
      // messageId: ctx.message.message_id,
      userId: ctx.user.userId,
      amount: amount,
      left: amount,
      price: price,
      isSell: isSell,
      type,
      due
    })
    bill = await bill.save()
    helpers.announceBill(ctx, bill) 
    // }
  },
  offerByAmount: Telegraf.branch(
    helpers.isGroup,
    Telegraf.branch(
      helpers.isReply,
      async ctx => {
        let bill = await Bill.findOne({
          messageId: ctx.message.reply_to_message.message_id
        })
        if (bill == undefined || bill.closed || bill.expired) {
          // faker.forceDeal(ctx.message.reply_to_message.message_id)
          return
        }
        let amount = +ctx.match[0]
        if (bill.sellAsWhole && bill.amount != amount) return
        if (!bill.sellAsWhole && bill.amount < amount) return

        let mx = await helpers.maxCanSell(ctx)
        let mcb = await helpers.maxCanBuy(ctx)
        // let bc = await ctx.setting.getBaseCharge()
        let bc =
          ctx.user.config.baseCharge == -1
            ? ctx.setting.getBaseCharge()
            : ctx.user.config.baseCharge

        let isSell = !bill.isSell
        // if (ctx.user.role == config.role_owner) {
        //     ctx.deleteMessage()
        // }

        if (ctx.user.charge < bc) {
          return ctx.telegram.sendMessage(
            ctx.message.from.id,
            'موجودی حساب شما کمتر از وجه تضمین است'
          )
        }
        if (!isSell && amount > mcb) {
          return ctx.telegram.sendMessage(
            ctx.message.from.id,
            'شما به حد اکثر میزان توانایی خرید خود رسیده اید\n اکانت خود را شارژ کرده'
          )
        }
        if (isSell && amount > mx) {
          return ctx.telegram.sendMessage(
            ctx.message.from.id,
            'شما به حد اکثر میزان توانایی فروش خود رسیده اید\n اکانت خود را شارژ کرده'
          )
        }
        if (!helpers.isComplete(ctx)) {
          return ctx.telegram.sendMessage(
            ctx.message.from.id,
            'لطفا ابتدا حساب خود را تکمیل نمایید'
          )
        }

        let price = bill.price
        // let type = bill.type
        let due = bill.due
        let sellerId, buyerId
        if (isSell) {
          sellerId = ctx.user.userId
          buyerId = bill.userId
        } else {
          buyerId = ctx.user.userId
          sellerId = bill.userId
        }

        ctx.values = {
          isSell,
          sellerId,
          buyerId,
          amount,
          price,
          bill,
          // type,
          due
        }

        helpers.makeDeal(ctx)
      },
      () => {}
    ),
    () => {}
  ),
  transactions: ctx => {}
}
