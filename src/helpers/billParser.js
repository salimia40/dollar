const User = require('../model/User')
const Bill = require('../model/Bill')
const { dateToString, toman, buyAvg, sellAvg } = require('./core')

const sellerBillToString = async (bill, result) => {
  let { totalCommition, totalProfit } = result

  let user = await User.findOne({
    userId: bill.userId
  })

  let sopfs = await Bill.find({
    userId: bill.userId,
    closed: true,
    left: {
      $gt: 0
    },
    isSell: true
  })

  let bopfs = await Bill.find({
    userId: bill.userId,
    closed: true,
    left: {
      $gt: 0
    },
    isSell: false
  })

  let avg = await sellAvg(bill.userId)
  let bavg = await buyAvg(bill.userId)

  let final = totalProfit - totalCommition
  let ft = ''
  if (final < 0) {
    ft = 'ضرر'
    final = Math.abs(final)
  } else ft = 'سود'

  let msg = `
👤 معامله گر گرامی ${user.name}
            
مقدار 🔴 فروش  : ${bill.amount} واحد به قیمت : ${toman(bill.price)}
            
📈 سود یا ضرر شما: ${toman(final) + ' ' + ft}`

  let ops = 0
  if (bopfs.length > 0) {
    bopfs.forEach(v => {
      ops += v.left
    })
    msg += `

⭕️ شما تعداد ${ops} واحد فاکتور باز خرید دارید.`

    msg += `
        
⭕️ میانگین فاکتور خرید: ${toman(bavg)}
            
⭕️ چناچه قیمت مظنه به : ${toman(bill.awkwardness.awk)} برسد 
            
📣 فاکتور خرید شما به قیمت: ${toman(bill.awkwardness.sellprice)} حراج می شود. `
  } else if (sopfs.length > 0) {
    sopfs.forEach(v => {
      ops += v.left
    })
    msg += `

⭕️ شما تعداد ${ops} واحد فاکتور باز فروش دارید.`
    msg += `
            
⭕️ میانگین فاکتور فروش: ${toman(avg)}
                
⭕️ چناچه قیمت مظنه به : ${toman(bill.awkwardness.awk)} برسد 
                
📣 فاکتور فروش شما به قیمت: ${toman(bill.awkwardness.sellprice)} حراج می شود. `
  } else {
    msg += `

⭕️ معاملات شما بسته شد و در حال حاضر فاکتور بازی ندارید`
  }

  msg += `
        
💶 موجودی شما برابر است با : ${toman(user.charge)}`
  return msg
}

const buyerBillToString = async (bill, result) => {
  let { totalCommition, totalProfit } = result

  let user = await User.findOne({
    userId: bill.userId
  })

  let sopfs = await Bill.find({
    userId: bill.userId,
    closed: true,
    left: {
      $gt: 0
    },
    isSell: true
  })

  let bopfs = await Bill.find({
    userId: bill.userId,
    closed: true,
    left: {
      $gt: 0
    },
    isSell: false
  })

  let avg = await buyAvg(bill.userId)
  let savg = await sellAvg(bill.userId)

  let final = totalProfit - totalCommition
  let ft = ''
  if (final < 0) {
    ft = 'ضرر'
    final = Math.abs(final)
  } else ft = 'سود'

  let msg = `
👤 معامله گر گرامی ${user.name}
            
مقدار 🔵 خرید  : ${bill.amount} واحد به قیمت : ${toman(bill.price)}
            
📈 سود یا ضرر شما: ${toman(final) + ' ' + ft}`

  let ops = 0
  if (sopfs.length > 0) {
    sopfs.forEach(v => {
      ops += v.left
    })
    msg += `

⭕️ شما تعداد ${ops} واحد فاکتور باز فروش دارید.`
    msg += `
            
⭕️ میانگین فاکتور فروش: ${toman(savg)}
                
⭕️ چناچه قیمت مظنه به : ${toman(bill.awkwardness.awk)} برسد 
                
📣 فاکتور فروش شما به قیمت: ${toman(bill.awkwardness.sellprice)} حراج می شود. `
  } else if (bopfs.length > 0) {
    bopfs.forEach(v => {
      ops += v.left
    })
    msg += `

⭕️ شما تعداد ${ops} واحد فاکتور باز خرید دارید.`
    msg += `
        
⭕️ میانگین فاکتور خرید: ${toman(avg)}
            
⭕️ چناچه قیمت مظنه به : ${toman(bill.awkwardness.awk)} برسد 
            
📣 فاکتور خرید شما به قیمت: ${toman(bill.awkwardness.sellprice)} حراج می شود. `
  } else {
    msg += `

⭕️ معاملات شما بسته شد و در حال حاضر فاکتور بازی ندارید`
  }

  msg += `
        
        💶 موجودی شما برابر است با : ${toman(user.charge)}`
  return msg
}

const billToSring = async (bill, result, user) => {
  var res

  let { totalCommition, totalProfit } = result

  let final = totalProfit - totalCommition

  var isSell = bill.isSell

  var tot = 0

  // let user = await User.findOne({
  //   userId: bill.userId
  // })

  let bills = await Bill.find({
    userId: bill.userId,
    closed: true,
    left: {
      $gt: 0
    }
  })

  var avg0 = 0
  var avg1 = 0
  var tot0 = 0
  var tot1 = 0
  while (bills.length > 0) {
    var b = bills.pop()
    if (b.due == 0) {
      if (b.isSell) tot0 += b.left
      else tot0 -= b.left
      avg0 += (b.isSell ? b.left : 0 - b.left) * b.price
    } else {
      if (b.isSell) tot1 += b.left
      else tot1 -= b.left
      avg1 += (b.isSell ? b.left : 0 - b.left) * b.price
    }
  }

  if (tot0 != 0) avg0 /= tot0
  if (tot1 != 0) avg1 /= tot1

  let ft = ''
  if (final < 0) {
    ft = 'ضرر 😔'
    final = Math.abs(final)
  } else if(final == 0) {
    ft = ''
  } else  ft = 'سود 🤩'

  var sample = `معامله گر گرامی x
  x مقدار x: x واحد به قیمت: x
  📈 سود یا زیان شما: x x z z
  💰موجودي شما : x تومان`

  var awkMsg = `
  🔘 شما تعداد x واحد فاکتور باز x x دارید.
  🔘 میانگین فاکتور x: x
  ⛔️ چناچه قیمت مظنه به : x برسد فاکتور خرید شما به قیمت: x حراج می شود.
  `

  var awkpart0 = ''
  var awkpart1 = ''

  if (tot0 != 0) {
    isSell = tot0 > 0
    tot0 = Math.abs(tot0)
    awkpart0 = awkMsg
      .replace('x', tot0)
      .replace('x', isSell ? 'فروش' : 'خرید')
      .replace('x', 'امروزی')
      .replace('x', isSell ? 'فروش' : 'خرید')
      .replace('x', Math.abs(avg0))
      .replace('x', toman(user.awkwardness.d0.awk))
      .replace('x', toman(user.awkwardness.d0.sellprice))
  }

  if (tot1 != 0) {
    isSell = tot1 > 0
    tot1 = Math.abs(tot1)
    awkpart1 = awkMsg
      .replace('x', tot1)
      .replace('x', isSell ? 'فروش' : 'خرید')
      .replace('x', 'فردایی')
      .replace('x', isSell ? 'فروش' : 'خرید')
      .replace('x', Math.abs(avg1))
      .replace('x', toman(user.awkwardness.d1.awk))
      .replace('x', toman(user.awkwardness.d1.sellprice))
  }

  res = sample
    .replace('x', user.name)
    .replace('x', bill.isSell ? '🔴' : '🔵')
    .replace('x', bill.isSell ? 'فروش' : 'خرید')
    .replace('x', bill.amount)
    .replace('x', bill.price)
    .replace('x', final)
    .replace('x', ft)
    .replace('x', toman(user.charge))
    .replace('z', awkpart0)
    .replace('z', awkpart1)

  return res
}

module.exports = {
  billToSring,
  buyerBillToString,
  sellerBillToString
}
