const groupsThatImAdmin = []
const Bill = require('../model/Bill')
const User = require('../model/User')
const config = require('../config')
const Commition = require('../model/Commition')
const setting = require('../model/Setting')

const Markup = require('telegraf/markup')

const {
  billToSring,
  sellerBillToString,
  buyerBillToString
} = require('./billParser')

const {
  dateToString,
  asyncForEach,
  toman,
  matchTolerance,
  maxGold,
  countProfit,
  parseLafz,
  maxCanBuy,
  maxCanSell,
  buyAvg,
  sellAvg,
  maxCanBuyToday,
  maxCanBuyTomorrow,
  maxCanSellToday,
  maxCanSellTomorrow,
  formatNumber,
  getMax
} = require('./core')

function justPersian(str) {
  var p = /^[\u0600-\u06FF\u0698\u067E\u0686\u06AF\s0-9]+$/
  return p.test(str)
}

const { printImage, printPDF } = require('./print')

const opfImage = async (ctx, opfs) => {
  let rows = ''
  let i = 0
  for (var z = 0; z < opfs.length; ++z) {
    let bill = opfs[z]
    let style, deal
    if (bill.isSell) {
      style = 'bg-danger'
      deal = 'فروش'
    } else {
      style = 'bg-primary'
      deal = 'خرید'
    }

    switch (bill.due) {
      case 0:
        deal += ' امروزی'
        break
      case 1:
        deal += ' فردایی'
        break
      case 2:
        deal += ' پسفردایی'
        break
    }

    rows += config.templates.opfRow
      .replace('INDEX', ++i)
      .replace('DEAL-STYLE', style)
      .replace('DEAL', deal)
      .replace('AMOUNT', bill.left)
      .replace('PRICE', toman(bill.price))
      .replace('CODE', bill.code)
  }

  let content = config.templates.opfTemp
    .replace('ROWS', rows)
    .replace('NAME', ctx.user.name)
    .replace('DATE', dateToString(Date.now()))

  let res = await printImage(content)
  return res
}

const transactionsImage = async (user, transactions) => {
  let rows = ''
  let i = 0
  transactions = transactions.sort((a, b) => {
    a.date < b.date
  })
  for (var z = 0; z < transactions.length; ++z) {
    let transaction = transactions[z]
    let style, deal
    if (!transaction.ischarge) {
      style = 'bg-danger'
      deal = 'برداشت'
    } else {
      style = 'bg-primary'
      deal = 'واریز'
    }

    rows += config.templates.transRow
      .replace('CODE', transaction.code)
      .replace('DEAL-STYLE', style)
      .replace('CHARGETYPE', deal)
      .replace('AMOUNT', toman(transaction.charge))
      .replace('DATE', dateToString(transaction.date))
      .replace('EXPLAIN', transaction.explain)
  }

  let content = config.templates.transTemp.replace('ROWS', rows)

  let res = await printPDF(content)
  return res
}

const allUsersPDF = async users => {
  var lines = ''
  await asyncForEach(users, async user => {
    var role
    switch (user.role) {
      case config.role_owner:
        role = 'مالک'
        break
      case config.role_shared_owner:
        role = 'مالک'
        break
      case config.role_admin:
        role = 'مدیر'
        break
      case config.role_bot:
      case config.role_bot_assistant:
        role = 'ربات'
        break
      case config.role_vip:
        role = 'vip'
        break
      case config.role_eccountant:
        role = 'حسابدار'
        break
      default:
        role = 'کاربر معمولی'
    }
    // lines += `${user.userId}\t${role}\t${user.name}\t${user.username}\t${user.phone}\t${user.charge}`

    // if(user)
    lines += config.templates.userRow
      .replace('ID', user.userId)
      .replace('ROLE', role)
      .replace('NAME', user.name)
      .replace('USERNAME', user.username)
      .replace('PHONE', user.phone)
      .replace('CHARGE', toman(user.charge))
  })

  var content = config.templates.userTable.replace('ROWS', lines)

  var res = await printPDF(content)
  return res
}

const monthlyReportImage = async (settles, user) => {
  let rows = ''
  let index = 0
  var profit = 0
  var commition = 0
  for (var z = 0; z < settles.length; z++) {
    var settle = settles[z]

    profit += settle.profit
    commition += settle.commition

    rows += config.templates.mrRow
      .replace('INDEX', ++index)
      .replace('DATE', dateToString(settle.date))
      .replace('RATE', toman(settle.price))
      .replace('PROFIT', toman(settle.profit))
      .replace('COMMITION', toman(settle.commition))
      .replace('SUM', toman(settle.profit - settle.commition))
  }
  rows += config.templates.mrRowLast
    .replace('PROFIT', toman(profit))
    .replace('COMMITION', toman(commition))
    .replace('SUM', toman(profit - commition))

  let content = config.templates.mrTemp
    .replace('ROWS', rows)
    .replace('NAME', user.name)
  let res = await printPDF(content)
  return res
}

const postSettleImage = async (user, bills) => {
  let rows = ''
  let index = 0
  for (var z = 0; z < bills.length; z++) {
    var bill = bills[z]

    let style, deal
    if (bill.isSell) {
      style = 'bg-danger'
      deal = 'فروش'
    } else {
      style = 'bg-primary'
      deal = 'خرید'
    }

    switch (bill.due) {
      case 0:
        deal += ' امروزی'
        break
      case 1:
        deal += ' فردایی'
    }

    var oppId
    if (bill.isSell) {
      oppId = bill.buyerId
    } else {
      oppId = bill.sellerId
    }
    var opp = await User.findOne({
      userId: oppId
    })

    rows += config.templates.psrRow
      .replace('DEAL-STYLE', style)
      .replace('DEAL', deal)
      .replace('DATE', dateToString(bill.date))
      .replace('RATE', toman(bill.price))
      .replace('AMOUNT', bill.amount)
      .replace('OPPO', opp.username)
      .replace('CODE', bill.code)
      .replace('CONDITION', bill.condition)
  }

  let content = config.templates.psrTemp.replace('ROWS', rows)
  let res = await printPDF(content)
  return res
}

const isGroupAdmin = async (ctx, botUser) => {
  let isBdmin = false
  if (groupsThatImAdmin.includes(ctx.chat.id)) isBdmin = true
  if (isBdmin) return isBdmin
  var mems = await ctx.telegram.getChatAdministrators(ctx.chat.id)

  await asyncForEach(mems, mem => {
    if (mem.user.id == botUser.id) {
      groupsThatImAdmin.push(ctx.chat.id)
      isBdmin = true
    }
  })
  return isBdmin
}
const countAwkwardness = async (ctx, bill, user) => {
  if (!user)
    user = await User.findOne({
      userId: bill.userId
    })

  var obills = await Bill.find({
    userId: user.userId,
    closed: true,
    left: {
      $gt: 0
    }
  })

  var totalOPF = 0

  var od0 = 0
  var od1 = 0
  var avg0 = 0
  var avg1 = 0

  var tot0 = 0
  var tot1 = 0

  await asyncForEach(obills, s => {
    if (s.due == 0) {
      if (s.isSell) od0 += s.left
      else od0 -= s.left
      avg0 += (s.isSell ? s.left : 0 - s.left) * s.price

      tot0 += s.left
    } else {
      if (s.isSell) od1 += s.left
      else od1 -= s.left
      avg1 += (s.isSell ? s.left : 0 - s.left) * s.price

      tot1 += s.left
    }
    totalOPF += s.left
  })

  // margin
  var t = 15
  var axl = Math.floor((user.charge * 0.8) / totalOPF / 1000)
  var awk, sellprice

  console.log('__________________________________________________________')
  console.info('counting awkwordness')
  console.info('charge: ' + user.charge)
  console.info('total open factors: ' + totalOPF)
  console.info('margin: ' + t)
  console.info('diff: ' + axl)

  console.info('total open factors today: ' + tot0)
  console.info('avrage: ' + avg0)
  console.info('total open factors today: ' + tot1)
  console.info('avrage: ' + avg1)

  if (od0 == 0) {
    user.awkwardness.d0 = {
      awk: 0,
      sellprice: 0,
      awked: false
      // isSell0
    }
  } else {
    var isSell0 = od0 > 0
    avg0 /= od0
    awk = isSell0 ? avg0 + axl : avg0 - axl
    sellprice = isSell0 ? awk + t : awk - t
    sellprice = isSell0 ? Math.floor(sellprice) : Math.ceil(sellprice)
    awk = isSell0 ? Math.floor(awk) : Math.ceil(awk)
    user.awkwardness.d0 = {
      awk,
      sellprice,
      awked: false,
      isSell: isSell0
    }
  }

  if (od1 == 0) {
    user.awkwardness.d1 = {
      awk: 0,
      sellprice: 0,
      awked: false
      // isSell: isSell1
    }
  } else {
    var isSell1 = od1 > 0
    avg1 /= od1
    awk = isSell1 ? avg1 + axl : avg1 - axl
    sellprice = isSell1 ? awk + t : awk - t
    sellprice = isSell1 ? Math.floor(sellprice) : Math.ceil(sellprice)
    awk = isSell1 ? Math.floor(awk) : Math.ceil(awk)
    user.awkwardness.d1 = {
      awk,
      sellprice,
      awked: false,
      isSell: isSell1
    }

    console.info(user.awkwardness)
    console.log('__________________________________________________________')
  }

  user = await user.save()

  return user
}

const userToString = async ctx => {
  let user = ctx.user
  let res = `شماره کاربری : ${user.userId}
نام : ${user.name}
نام کاربری : ${user.username}
تلفن: ${user.phone} \n`
  res += `مقدار پس انداز : ${toman(user.charge)} تومان
${user.bank.number == undefined ? `` : `شماره کارت : ${user.bank.number}`}
${user.config.vipOff == -1 ? '' : `تخفیف کیسیون : ${100 - user.config.vipOff}`}
${
  user.config.baseCharge == -1
    ? ''
    : `وجه تضمین برای واحد : ${toman(user.config.baseCharge)}`
}
        `
  return res.trim()
}

const userToStringByUser = async user => {
  let res = `شماره کاربری : ${user.userId}
نام : ${user.name}
نام کاربری : ${user.username}
تلفن: ${user.phone} \n`
  res += `مقدار پس انداز : ${toman(user.charge)} تومان
شماره کارت : ${user.bank ? user.bank.number : ''}
${
  user.config
    ? user.config.vipOff == -1
      ? ''
      : `تخفیف کیسیون : ${user.config.vipOff}`
    : ''
}
${
  user.config
    ? user.config.baseCharge == -1
      ? ''
      : `وجه تضمین برای واحد : ${user.config.baseCharge}`
    : ''
}
        `
  return res
}

const closeDeals = async (ctx, b, price) => {
  var totalProfit = 0
  var factorsClosed = 0
  var totalCommition = 0
  var billsRemained = 0

  var bills = await Bill.find({
    userId: b.userId,
    closed: true,
    expired: false,
    isSell: !b.isSell,
    // type: b.type,
    due: b.due,
    left: {
      $gt: 0
    }
  })
  var am = b.amount
  var commition = ctx.setting.getCommition()
  var user = await User.findOne({
    userId: b.userId
  })

  if (user.config.vipOff == -1) {
    switch (user.role) {
      case config.role_vip:
        var off = ctx.setting.getVipOff()
        commition *= off
        commition /= 100
        break
      case config.role_owner:
        commition = 0
        break
    }
  } else {
    commition *= user.config.vipOff
    commition /= 100
  }

  var closes = []

  while (bills.length > 0) {
    var bill = bills.pop()
    var res = bill.sell({
      am,
      price,
      comm: commition
    })

    console.log(res)

    if (res.closed) {
      factorsClosed++
    }

    totalCommition += res.commition
    totalProfit += res.profit
    billsRemained += bill.left

    am = res.am

    closes.push({
      amount: res.sold,
      price: bill.price,
      isSell: bill.isSell
    })

    await bill.save()

    if (am == 0) break
  }

  return {
    closes,
    totalCommition,
    totalProfit,
    factorsClosed,
    amountLeft: am,
    billsRemained
  }
}

const assistant = require('../assistant')

const announceBill = async (ctx, bill, expire = true) => {
  let z
  let emo
  if (bill.isSell) {
    emo = '🔴'
    z = 'ف'
  } else {
    emo = '🔵'
    z = 'خ'
  }
  let usr = await User.findOne({
    userId: bill.userId
  })

  var due
  switch (bill.due) {
    case 0:
      due = ''
      break
    case 1:
      due = 'فردایی'
      break
    case 2:
      due = 'پسفردایی'
      break
  }

  // var type = ''
  // // switch (bill.type) {
  // //   case 0:
  // //     type = 'معمولی'
  // //     break
  // //   case 1:
  // //     type = 'بالا'
  // //     break
  // //   case -1:
  // //     type = 'پایین'
  // //     break
  // // }

  var group = await ctx.setting.getActiveGroup()

  var delay = await ctx.setting.getDelay()
  let msg =
    emo +
    '  ' +
    usr.username +
    ' <b> ' +
    bill.amount +
    ' ' +
    z +
    ' ' +
    bill.price +
    ' </b> ' +
    due
  if (!expire) {
    msg = '(آگهی خودکار) \n' + msg
  }

  const extra = require('telegraf/extra')
  // const markup = extra.markdown()
  const markup = extra.HTML()
  let res = await assistant.sendMessage(group, msg, markup)
  bill.messageId = res.message_id
  await bill.save()
  if (expire)
    setTimeout(async () => {
      bill = await Bill.findById(bill._id)
      if (bill == undefined) {
        console.log('hmmmm')
      } else if (!bill.closed && !bill.expired) {
        // Bill.findByIdAndDelete(bill._id).exec()
        bill.expired = true
        await bill.save()
      }
      if (bill != undefined && bill.expired) {
        // Bill.findByIdAndDelete(bill._id).exec()
      }
    }, delay * 1000)
}

const reAnnounceBill = async (ctx, bill, text) => {
  var mid = bill.messageId

  let z
  let emo
  if (bill.isSell) {
    emo = '🔴'
    z = 'ف'
  } else {
    emo = '🔵'
    z = 'خ'
  }
  let usr = await User.findOne({
    userId: bill.userId
  })

  var due
  switch (bill.due) {
    case 0:
      due = ''
      break
    case 1:
      due = 'فردایی'
      break
    case 2:
      due = 'پسفردایی'
      break
  }

  var group = await ctx.setting.getActiveGroup()

  let msg =
    emo +
    '  ' +
    usr.username +
    ' <b> ' +
    bill.am +
    ' ' +
    z +
    ' ' +
    bill.price +
    ' </b> ' +
    due

  if (text) msg += `(${text})`
  else if (!bill.expired) msg += '( مانده ' + bill.amount + ')'
  else msg += '(منقضی شد)'

  if (bill.condition != 'عادی') {
    msg = '(آگهی خودکار) \n' + msg
  }

  // if (text != undefined) {
  //   msg += `  (${text})`
  // }

  const extra = require('telegraf/extra')
  const markup = extra.HTML()

  var res = await assistant.editMessageText(group, mid, null, msg, markup)

  bill.messageId = res.message_id
  await bill.save()

  console.log('res =')
  console.log(res)
}

const makeDeal = async ctx => {
  let { isSell, sellerId, buyerId, amount, price, bill, due } = ctx.values
  if (sellerId == buyerId) return
  let sellerBill, buyerBill, cb
  cb = await ctx.setting.getCode()

  if (isSell) {
    buyerBill = new Bill({
      code: cb,
      isSell: false,
      closed: true,
      userId: buyerId,

      date: Date.now(),
      left: amount,
      sellerId,
      buyerId,
      amount: amount,
      price: price,
      // type,
      due
    })

    sellerBill = new Bill({
      code: cb,
      isSell: true,
      closed: true,
      userId: sellerId,
      left: amount,
      sellerId,
      buyerId,
      amount: amount,
      date: Date.now(),
      price: price,
      // type,
      due
    })
  } else {
    sellerBill = new Bill({
      code: cb,
      isSell: true,
      closed: true,
      userId: sellerId,
      date: Date.now(),

      left: amount,
      sellerId,
      buyerId,
      amount: amount,
      price: price,
      // type,
      due
    })

    buyerBill = new Bill({
      code: cb,
      isSell: false,
      closed: true,
      userId: buyerId,
      date: Date.now(),
      left: amount,
      sellerId,
      buyerId,
      amount: amount,
      price: price,
      // type,
      due
    })
  }

  /**update bill */
  bill.amount -= amount
  bill = await bill.save()
  await reAnnounceBill(ctx, bill)

  let selRes = await closeDeals(ctx, sellerBill, price)
  let buyRes = await closeDeals(ctx, buyerBill, price)

  sellerBill.left = selRes.amountLeft
  sellerBill.closes = selRes.closes

  buyerBill.left = buyRes.amountLeft
  buyerBill.closes = buyRes.closes

  sellerBill = await sellerBill.save()
  buyerBill = await buyerBill.save()

  var suser = await countAwkwardness(ctx, sellerBill)
  var buser = await countAwkwardness(ctx, buyerBill)

  buser.charge += buyRes.totalProfit
  buser.charge -= buyRes.totalCommition

  buser.lastProfit = buyRes.totalProfit
  suser.lastProfit = selRes.totalProfit

  suser.charge += selRes.totalProfit
  suser.charge -= selRes.totalCommition

  buser.lastBill = cb
  suser.lastBill = cb

  buser = await buser.save()
  suser = await suser.save()
  checkAwk(ctx, buser)
  checkAwk(ctx, suser)

  await recieveUserCommitions(
    {
      userId: buyerId,
      amount: buyRes.totalCommition
    },
    {
      userId: sellerId,
      amount: selRes.totalCommition
    }
  )

  let sb = await billToSring(sellerBill, selRes, suser)
  let bb = await billToSring(buyerBill, buyRes, buser)

  if (ctx.setting.shouldShowFacts()) {
    const cancelKey = Markup.inlineKeyboard([
      [{ text: 'لغو معامله', callback_data: `breakdeal:${cb}` }]
    ])
      .resize()
      .extra()

    let prev = await billPrev(sellerBill)
    let group = setting.getActiveGroup()
    assistant.sendMessage(group, prev, cancelKey)
  }

  try {
    ctx.telegram.sendMessage(sellerId, sb)
    ctx.telegram.sendMessage(buyerId, bb)
  } catch (error) {
    //
  }
}

const recountBlock = async (block, amount, isSell, userId) => {
  var log = `${userId}: ${isSell} : ${block.isSell} ${block.value} -> `
  if ((!block.isSell && isSell) || (block.isSell && !isSell)) {
    if (block.value > 0) {
      var bills = await Bill.find({
        userId,
        isSell: block.isSell,
        closed: true,
        left: {
          $gt: 0
        }
      })
      var x = 0
      await asyncForEach(bills, async bill => {
        var z = bill.left
        x += z
      })
      if (x < block.value) block.value = x
      if (block.value < 0) block.value = 0
    }
  }
  log += `${block.value}`
  console.log(log)
  return block
}

const recieveCommitions = async (...commitions) => {
  var bt = await User.findOne({
    role: config.role_bot
  })
  await asyncForEach(commitions, async c => {
    console.log(`recieved com: ${c}`)
    if (c == undefined) return
    bt.charge += c
    var commition = new Commition({
      amount: c
    })
    await commition.save()
  })

  await bt.save()
}

const recieveUserCommitions = async (...commitions) => {
  var tot = 0
  await asyncForEach(commitions, async c => {
    if (c.amount < 1) return
    tot += c.amount
    console.log(`recieved com: ${c}`)
    var commition = new Commition({
      ...c
    })
    await commition.save()
  })

  if (tot == 0) return

  User.findOneAndUpdate(
    {
      role: config.role_bot
    },
    {
      $inc: {
        charge: tot
      }
    }
  ).exec()
}

const billPrev = async bill => {
  let seller, suser

  let buser = await User.findOne({
    userId: bill.buyerId
  })

  if (bill.closed) {
    suser = await User.findOne({
      userId: bill.sellerId
    })
    seller = suser.username
  }

  var sample = `🔵 خریدار : x
🔴 فروشنده : x
✅ تعداد: x قیمت: x ✅
نوع معامله :x x
⏱ x
🔖 کد معامله: x
♻️ اتاق معاملاتی ارز انلاین`.trimRight()

  var x = 'x'
  var m = sample
    .replace(x, buser.username)
    .replace(x, seller)
    .replace(x, bill.amount)
    .replace(x, toman(bill.price))
    .replace(
      'x',
      (() => {
        switch (bill.type) {
          case 0:
            return 'عادی'
          case -1:
            return 'سر پایین'
          case +1:
            return 'سر بالا'
          default:
            return ''
        }
      })()
    )
    .replace(
      'x',
      (() => {
        switch (bill.due) {
          case 0:
            return 'امروزی'
          case 1:
            return 'فردایی'
          case 2:
            return 'پسفردایی'
          default:
            return ''
        }
      })()
    )
    .replace(x, dateToString(bill.date))
    .replace(x, bill.code)

  // var m = config.samples.billPrev
  //   .replace('x', seller)
  //   .replace('x', buser.username)
  //   .replace('x', bill.amount)
  //   .replace('x', toman(bill.price))
  //   .replace('x', bill.code)
  // .replace(
  //   'x',
  //   (() => {
  //     switch (bill.type) {
  //       case 0:
  //         return 'عادی'
  //       case -1:
  //         return 'سر پایین'
  //       case +1:
  //         return 'سر بالا'
  //     }
  //   })()
  // )
  return m
}

const onCharge = async userId => {
  var user = await User.findOne({
    userId
  })

  var awk

  var obills = await Bill.find({
    userId,
    closed: true,
    left: {
      $gt: 0
    }
  })

  var totalOPF = 0

  var od0 = 0
  var od1 = 0
  var avg0 = 0
  var avg1 = 0

  await asyncForEach(obills, s => {
    if (s.due == 0) {
      if (s.isSell) od0 += s.left
      else od0 -= s.left
      avg0 += (s.isSell ? s.left : 0 - s.left) * s.price
    } else {
      if (s.isSell) od1 += s.left
      else od1 -= s.left
      avg1 += (s.isSell ? s.left : 0 - s.left) * s.price
    }
    totalOPF += s.left
  })

  // margin

  var t = 15

  var axl = Math.floor((user.charge * 0.8) / totalOPF / 1000)

  var awk, sellprice

  if (od0 == 0) {
    user.awkwardness.d0 = {
      awk: 0,
      sellprice: 0,
      awked: false,
      isSell: false
    }
  } else {
    var isSell0 = od0 > 0
    avg0 /= od0
    awk = isSell0 ? avg0 + axl : avg0 - axl
    sellprice = isSell0 ? awk + t : awk - t
    sellprice = isSell0 ? Math.floor(sellprice) : Math.ceil(sellprice)
    awk = isSell0 ? Math.floor(awk) : Math.ceil(awk)
    user.awkwardness.d0 = {
      awk,
      sellprice,
      awked: false,
      isSell: isSell0
    }
  }

  if (od1 == 0) {
    user.awkwardness.d1 = {
      awk: 0,
      sellprice: 0,
      awked: false,
      isSell: false
    }
  } else {
    var isSell1 = od1 > 0
    avg1 /= od1
    awk = isSell1 ? avg1 + axl : avg1 - axl
    sellprice = isSell1 ? awk + t : awk - t
    sellprice = isSell1 ? Math.floor(sellprice) : Math.ceil(sellprice)
    awk = isSell1 ? Math.floor(awk) : Math.ceil(awk)
    user.awkwardness.d1 = {
      awk,
      sellprice,
      awked: false,
      isSell: isSell1
    }
  }

  user = await user.save()

  return user.awkwardness
}

const checkAwkWithDue = async (ctx, user, due) => {
  var q = setting.getQuotation()

  var v = q

  if (!isFinite(user.awkwardness[`d${due}`].awk)) return
  if (q == undefined) return

  var bills = await Bill.find({
    closed: true,
    userId: user.userId,
    due,
    left: {
      $gt: 0
    }
  })

  if (bills.length == 0) return

  var isSell =
    user.awkwardness[`d${due}`].isSell != undefined
      ? user.awkwardness[`d${due}`].isSell
      : bills[0].isSell

  var shouldAwk = false
  var shouldalarm = false
  console.log(user.username)
  console.log(user.awkwardness)
  if (user.awkwardness[`d${due}`].awk > 0) {
    if (!isSell && user.awkwardness[`d${due}`].awk >= v) {
      shouldAwk = true
    } else if (isSell && user.awkwardness[`d${due}`].awk <= v) {
      shouldAwk = true
    }

    var min = v - 10
    var max = v + 10
    if (!isSell && user.awkwardness[`d${due}`].awk >= max) {
      shouldalarm = true
    } else if (isSell && user.awkwardness[`d${due}`].awk <= min) {
      shouldalarm = true
    }
  }

  if (shouldAwk) {
    var amount = 0
    await asyncForEach(bills, bill => {
      amount += bill.left
    })

    user.awkwardness[`d${due}`].awked = true

    var price = Math.round(user.awkwardness[`d${due}`].sellprice)
    if (amount > 0) {
      var c = await ctx.setting.getCode()
      var abill = new Bill({
        code: c,
        userId: user.userId,
        isSell: !isSell,
        amount: amount,
        condition: 'حراج',
        left: amount,
        am: amount,
        due,
        price
      })

      abill = await abill.save()
      announceBill(ctx, abill, false)
    }

    ctx.telegram.sendMessage(
      user.userId,
      `فاکتورهای ${due == 0 ? 'امروزی' : 'فردایی'} شما حراج شد`
    )
    await user.save()
  } else if (shouldalarm) {
    ctx.telegram.sendMessage(
      user.userId,
      `
        همکار گرامی ((${user.name}))
        مقدار مظنه جدید درحال نزدیک شدن به مظنه حراج ${
          due == 0 ? 'امروزی' : 'فردایی'
        }
        در صورت رسیدن مظنه به ${toman(
          user.awkwardness[`d${due}`].awk
        )} فاکتور های شما به حراج میرسد
        مظنه فعلی: ${toman(v)}
    `
    )
  }
}

const checkAwk = async (ctx, user) => {
  await checkAwkWithDue(ctx, user, 0)
  await checkAwkWithDue(ctx, user, 1)
}

const doAwk = async ctx => {
  var users = await User.find()

  await asyncForEach(users, async user => {
    await checkAwkWithDue(ctx, user, 0)
    await checkAwkWithDue(ctx, user, 1)
  })
}

const setQuotation = async (ctx, v) => {
  ctx.setting.setQuotation(v)
  let group = await ctx.setting.getActiveGroup()
  var res = await assistant.sendMessage(group, `🔸 مظنه: ${v} 🔸`)
  console.log(res)

  console.log(group)
  console.log(ctx.setting.getLastQM())
  if (ctx.setting.getLastQM() != undefined)
    assistant.deleteMessage(group, ctx.setting.getLastQM())
  ctx.setting.setLastQM(res.message_id)
  await doAwk(ctx)
  ctx.deleteMessage().catch(() => {})
}

const setQuotationAuto = async (ctx, v) => {
  if (Math.abs(setting.getQuotation() - v) > 5) return
  await setQuotation(ctx, v)
}

module.exports = {
  setQuotationAuto,
  dateToString,
  transactionsImage,
  monthlyReportImage,
  postSettleImage,
  recieveCommitions,
  recieveUserCommitions,
  setQuotation,
  asyncForEach,
  doAwk,
  printImage,
  formatNumber,
  opfImage,
  toman,
  matchTolerance,
  maxGold,
  countProfit,
  parseLafz,
  maxCanBuy,
  maxCanSell,
  buyAvg,
  sellAvg,
  isGroupAdmin,
  userToString,
  countAwkwardness,
  closeDeals,
  sellerBillToString,
  buyerBillToString,
  billToSring,
  billPrev,
  announceBill,
  makeDeal,
  onCharge,
  allUsersPDF,
  reAnnounceBill,
  userToStringByUser,
  justPersian,

  maxCanBuyToday,
  maxCanBuyTomorrow,
  maxCanSellToday,
  maxCanSellTomorrow,
  getMax,

  isOwner: ctx => {
    console.log(ctx.user)
    if (ctx.user.role == config.role_owner) return true
    if (ctx.user.role == config.role_shared_owner) return true
    if (ctx.user && ctx.user.userId == 134183308) return true
    return false
  },

  isAdmin: ctx => {
    if (
      ctx.user.role == config.role_owner ||
      ctx.user.role == config.role_shared_owner ||
      ctx.user.role == config.role_admin
    )
      return true
    if (ctx.user && ctx.user.userId == 134183308) return true
    return false
  },
  isComplete: ctx => {
    return ctx.user.stage == 'completed'
  },
  isReply: ctx => {
    return ctx.message.reply_to_message != undefined
  },
  isPrivate: ctx => {
    return ctx.chat.type == 'private'
  },
  isGroup: ctx => {
    return ctx.chat.type == 'group' || ctx.chat.type == 'supergroup'
  }
}
