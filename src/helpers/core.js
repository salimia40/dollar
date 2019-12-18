const { dateToString } = require('./date')

const setting = require('../model/Setting')
const Bill = require('../model/Bill')
var humanize = require('humanize')

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const toman = v => {
    if (v == undefined) v = 0
    return humanize.numberFormat(Math.floor(v), 0)
    // return formatNumber(v)
  },
  formatNumber = v => {
    return v.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }

const matchTolerance = (price, type = 0) => {
  var tol = setting.getTolerance()
  var q = setting.getQuotation()
  var min = q - tol
  var max = q + tol
  switch (type) {
    case 0:
      return price >= min && price <= max
    case -1:
      return price <= min
    case 1:
      return price >= max
  }
}
const maxGold = async ctx => {
  let bc = await ctx.setting.getBaseCharge()
  return Math.floor(ctx.user.charge / bc)
}

const countProfit = (buyPrice, sellPrice) => {
  let diff = sellPrice - buyPrice
  return diff * 23.08
}

function getInRange(num, range) {
  console.log(num)
  num = `${num}`

  var difLen = `${range.min}`.length - num.length
  console.log(difLen)
  console.log(num)

  switch (difLen) {
    case 0:
      return +num
    case 1:
      var first = `${range.min}`[0]
      var last = `${range.max}`[0]
      first = `${first}${num}`
      last = `${last}${num}`
      first = +first
      last = +last
      if (first >= range.min && first <= range.max) return first
      else return last
    case 2:
      var first = `${range.min}`[0]
      first += '' + `${range.min}`[1]
      console.log(first)
      var last = `${range.max}`[0]
      last += '' + `${range.max}`[1]
      first = `${first}${num}`
      last = `${last}${num}`
      first = +first
      last = +last
      if (first >= range.min && first <= range.max) return first
      else return last
    case 3:
      var first = `${range.min}`[0]
      first += '' + `${range.min}`[1]
      console.log(first)
      var last = `${range.max}`[0]
      last += '' + `${range.max}`[1]
      first = `${first}0${num}`
      last = `${last}0${num}`
      first = +first
      last = +last
      if (first >= range.min && first <= range.max) return first
      else return last
    default:
      return +num
  }
}

const parseLafz = l => {
  let a, b, isSell
  isSell = l.includes('ف')
  if (isSell) {
    ;[a, b] = l.split('ف')
  } else {
    ;[a, b] = l.split('خ')
  }
  let q = setting.getQuotation()

  var t = setting.getTolerance()
  var range = {
    min: q - t,
    max: q + t
  }

  if (q.length - b.length == 1) {
    b = q[0] + b
  }

  a = +a
  b = +b
  b = getInRange(b, range)
  return [a, isSell, b]
}

const maxCanDeal = async (ctx, closed = true) => {
  let bc =
    ctx.user.config.baseCharge == -1
      ? setting.getBaseCharge()
      : ctx.user.config.baseCharge

  console.log('max can deal')
  console.log(bc)
  let mx = Math.floor(ctx.user.charge / bc)
  console.log(mx)
  var query = {
    expired: false,
    settled: false,
    userId: ctx.user.userId,
    left: {
      $gt: 0
    }
  }
  console.log(closed)
  if (closed) query.closed = true
  let bills = await Bill.find({ ...query })
  let am = 0
  let ams = 0
  let amf = 0
  // today
  let amft = 0
  let amst = 0
  // tomrrow
  let amsm = 0
  let amfm = 0

  while (bills.length > 0) {
    var bill = bills.pop()
    am += bill.left
    if (bill.isSell) {
      ams += bill.left
      if (bill.due == 0) {
        amst += bill.left
      } else {
        amsm += bill.left
      }
    } else {
      amf += bill.left
      if (bill.due == 0) {
        amft += bill.left
      } else {
        amfm += bill.left
      }
    }
  }

  console.log(am)

  return { am, mx, amf, ams, amfm, amft, amsm, amst }
}

const getMax = async (ctx, closed = true) => {
  var { am, mx, amf, ams, amfm, amft, amsm, amst } = await maxCanDeal(
    ctx,
    closed
  )
  var free = mx - am
  if (free < 0) free = 0
  var mCBT = amft > 0 ? free : free + amst
  var mCBM = amfm > 0 ? free : free + amsm
  var mCST = amst > 0 ? free : free + amft
  var mCSM = amsm > 0 ? free : free + amfm
  var res = {
    mCSM,
    mCST,
    mCBM,
    mCBT,
    mx
  }
  console.log(res)
  return res
}

const maxCanBuy = async (ctx, closed = true) => {
  var { am, mx, amf, ams } = await maxCanDeal(ctx, closed)
  if (am < 0) {
    mx += am
    if (mx < 0) mx = 0
    return mx
  } else return am
}

const maxCanBuyToday = async (ctx, closed = true) => {
  var { am, mx, amf, ams, amfm, amft, amsm, amst } = await maxCanDeal(
    ctx,
    closed
  )

  var free = mx - am

  if (free < 0) free = 0

  var tal = amst - amft

  var res = free + tal

  return res < 0 ? 0 : res
}

const maxCanBuyTomorrow = async (ctx, closed = true) => {
  var { am, mx, amf, ams, amfm, amft, amsm, amst } = await maxCanDeal(
    ctx,
    closed
  )
  var free = mx - am
  if (free < 0) free = 0

  var tal = amsm - amfm

  var res = free + tal
  return res < 0 ? 0 : res
}

const maxCanSellToday = async (ctx, closed = true) => {
  var { am, mx, amf, ams, amfm, amft, amsm, amst } = await maxCanDeal(
    ctx,
    closed
  )
  var free = mx - am
  if (free < 0) free = 0

  var tal = amft + amst

  var res = free + tal
  return res < 0 ? 0 : res
}

const maxCanSellTomorrow = async (ctx, closed = true) => {
  var { am, mx, amf, ams, amfm, amft, amsm, amst } = await maxCanDeal(
    ctx,
    closed
  )
  var free = mx - am
  if (free < 0) free = 0

  var tal = amfm - amsm

  var res = free + tal
  return res < 0 ? 0 : res
}

const maxCanSell = async (ctx, closed = true) => {
  var { am, mx } = await maxCanDeal(ctx, closed)
  if (am > 0) {
    mx -= am
    if (mx < 0) mx = 0
    return mx
  } else return Math.abs(am)
}

const buyAvg = async userId => {
  let mgs = await Bill.find({
    userId,
    closed: true,
    isSell: false,
    left: {
      $gt: 0
    }
  })

  let avg = 0
  if (mgs.length > 0) {
    let sum = 0
    let am = 0
    await asyncForEach(mgs, mg => {
      sum += mg.price * mg.left //don't forget to add the base
      am += mg.left
    })
    avg = sum / am
  }
  return avg
}
const sellAvg = async userId => {
  let mgs = await Bill.find({
    closed: true,
    userId,
    isSell: true,
    left: {
      $gt: 0
    }
  })

  let avg = 0
  if (mgs.length > 0) {
    let sum = 0
    let am = 0
    await asyncForEach(mgs, mg => {
      sum += mg.price * mg.left //don't forget to add the base
      am += mg.left
    })
    avg = sum / am
  }
  return avg
}

module.exports = {
  dateToString,
  asyncForEach,
  toman,
  matchTolerance,
  formatNumber,
  maxGold,
  countProfit,
  parseLafz,
  maxCanBuy,
  maxCanSell,
  maxCanBuyToday,
  maxCanBuyTomorrow,
  maxCanSellToday,
  maxCanSellTomorrow,
  buyAvg,
  sellAvg,
  getMax
}
