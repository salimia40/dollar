const Scene = require('telegraf/scenes/base')
const Transaction = require('../model/Transaction')
const { leave } = require('telegraf/stage')
const User = require('../model/User')
const Bill = require('../model/Bill')
const helpers = require('../helpers')
const queue = require('../queue')
const Settle = require('../model/Settle')
const config = require('../config')
const Markup = require('telegraf/markup')

const scene = new Scene('settleScene')
scene.enter(ctx => {
  ctx.reply(
    'لطفا نرخ تسویه را به هزار تومان به صورت عددی وارد نمایید.',
    Markup.inlineKeyboard([
      [
        {
          text: 'انصراف',
          callback_data: 'cancel'
        }
      ]
    ])
      .resize()
      .extra()
  )
})

scene.action(
  'cancel',
  (ctx, next) => {
    ctx.deleteMessage()
    next()
  },
  leave()
)

scene.hears(
  /\d+/,
  async (ctx, next) => {
    ctx.reply('در حال انجام شدن ...')
    var c = ctx.match[0]
    c = +c
    var price = c

    var users = await User.find()
    var botUsr = await User.findOne({
      role: config.role_bot
    })
    var commition = ctx.setting.getCommition()

    var botProfit = 0
    var am = 0

    //array to build report for owner
    var ms = []

    await helpers.asyncForEach(users, async user => {
      if (user.userId == botUsr.userId) return

      var bills = await Bill.find({
        userId: user.userId,
        // closed: true,
        expired: false,
        settled: false,
        due: 0
      })

      var comm = commition
      if (user.config.vipOff == -1) {
        switch (user.role) {
          case config.role_vip:
            var off = ctx.setting.getVipOff()
            comm = comm * off
            comm = comm / 100
            break
          case config.role_owner:
            comm = 0
            break
        }
      } else {
        comm = comm * user.config.vipOff
        comm = comm / 100
      }

      var newProfit = 0
      var newCommition = 0
      var totalCommition = 0
      var totalProfit = 0
      var sold = 0

      for (var index = 0; index < bills.length; index++) {
        var bill = bills[index]
        if (bill == undefined) continue
        if (bill.closed) {
          var res = bill.close({
            comm,
            price
          })
          newProfit += res.profit
          newCommition += res.commition
          sold += res.am
          bill.settled = true
          totalCommition += bill.commition
          totalProfit += bill.profit
        } else {
          bill.expired = true
        }
        await bill.save()
      }

      var isSell = sold >= 0
      if (sold < 0) sold = Math.abs(sold)

      user.charge += newProfit
      user.charge -= newCommition
      user = await user.save()

      await helpers.recieveUserCommitions({
        userId: user.userId,
        amount: newCommition
      })

      var settle = new Settle({
        price,
        userId: user.userId,
        commition: totalCommition,
        profit: totalProfit
      })
      settle = await settle.save()
      botProfit += totalCommition

      
      var title = isSell ? '🔴 فروشنده' : '🔵 خریدار'
      
      if (sold > 0) ms.push(`${title} : ${user.name} ✅ تعداد: ${sold} \n`)
      am += sold

      
      var prf = newProfit - newCommition
      var d = prf > 0 ? 'سود' : 'ضرر'
      prf = Math.abs(prf)

      var pallet = `👤 معامله گر گرامی x
            
x مقدار  x  : x واحد به قیمت : x
            
📈 سود یا ضرر شما: x x

⭕️ معاملات شما بسته شد و در حال حاضر فاکتور بازی ندارید
        
💶 موجودی شما برابر است با : x`

pallet = `سلام آقا/خانم x

شما روز date

با تسویه آبشده به نرخ price

مبلغ : profit تومان.

x کرده اید

جهت تسویه حساب لطفا مبلغ ضرر خود را تا ساعت 15 به شماره حسابهای زیر واریز نمایید و رسید واریزی را به خصوصی حسابدار بفرستید.
معامله گرانی که درخواست دریافت سود خود را دارند لطفا تا
ساعت 14 به حسابداری اطلاع دهند.
بانك ملت بنام حكيمه پَرَن
شماره كارت 6104-3375-6968-8821
شماره حساب 4647608171

بانك صادرات بنام سيدعلي موسوي
شماره كارت ‎6037-6974-6460-1779
شماره حساب 0333677670009
لطفا بعد از واريز حتما عکس فيش را با شماره پيگيري كه در فيش درج شده است ارسال كنيد.
با تشکر مديريت معاملات پرديس`


      // var umsg = pallet
      //   .replace('x', user.name)
      //   .replace('x', isSell ? '🔴' : '🔵')
      //   .replace('x', isSell ? 'فروش' : 'خرید')
      //   .replace('x', sold)
      //   .replace('x', helpers.toman(c))
      //   .replace('x', helpers.toman(prf))
      //   .replace('x', d)
      //   .replace('x', helpers.toman(user.charge))

      var umsg = pallet
      .replace('x', user.name)
          .replace('date', helpers.dateToString(settle.date))
          .replace('price', helpers.toman(c))
          .replace('profit', helpers.toman(prf))
          .replace('x', d)

      ctx.telegram.sendMessage(user.userId, umsg)
    })

    ms.push(`تعداد ${am} فاکتور بسته شد 
قیمت ${c}
سود ربات ${helpers.toman(botProfit)}`)
    var message = ''
    var index = 0

    console.log(ms)

    while (ms.length > 0) {
      var m = ms.shift()
      message += m
      index++
      if (index > 12 || ms.length == 0) {
        index = 0
        await ctx.reply(message)
        message = ''
      }
    }

    next()
  },
  leave()
)

scene.hears('خروج', leave())

module.exports = scene
