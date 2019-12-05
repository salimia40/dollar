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
      ? ctx.setting.getBaseCharge()
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

  while (bills.length > 0) {
    var bill = bills.pop()
    if( bill.isSell) {
      am += bill.left
    } else {
      am -= bill.left
    }
  }

  console.log(am)

  return {am,mx}
 
  mx -= Math.abs(am)

  if (mx < 0) mx = 0
  return mx
}

const maxCanBuy = async (ctx, closed = true) => {
  var {am,mx} = await maxCanDeal(ctx, closed)
  mx -= am
  
  if (mx < 0) mx = 0
  return mx
  
}

const maxCanSell = async (ctx, closed = true) => {
  var {am,mx} = await maxCanDeal(ctx, closed)
  mx -= am
  
  if (mx < 0) mx = 0
  return mx
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
  buyAvg,
  sellAvg
}
