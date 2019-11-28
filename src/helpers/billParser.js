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

const billToSring = async (bill, result) => {

  var res

  let { totalCommition, totalProfit } = result

  let final = totalProfit - totalCommition

  var isSell = bill.isSell

  var tot = 0

  let user = await User.findOne({
    userId: bill.userId
  })

  let bills = await Bill.find({
    userId: bill.userId,
    closed: true,
    left: {
      $gt: 0
    },
    due: bill.due
  })

  var avg = 0
  while (bills.length > 0) {
    var b = bills.pop()
    if (b.isSell) tot += b.left
    else tot -= b.left
    avg += b.left * b.price
  }

  avg /= tot

  let ft = ''
  if (final < 0) {
    ft = 'ضرر'
    final = Math.abs(final)
  } else ft = 'سود'

  var sample = `معامله گر گرامی x
  x مقدار x: x واحد به قیمت: x
  📈 سود یا زیان شما: x x z
  💰موجودي شما : x تومان`
  
    var awkMsg = `
  🔘 شما تعداد x واحد فاکتور باز x دارید.
  🔘 میانگین فاکتور x: x
  ⛔️ چناچه قیمت مظنه به : x برسد فاکتور خرید شما به قیمت: x حراج می شود.
  `

  var awkpart = ''
  
  if (tot != 0) {
      isSell = tot > 0
      tot = Math.abs(tot)
      awkpart = awkMsg
      .replace('x',tot)
      .replace('x',avg > 0 ? 'فروش': 'خرید')
      .replace('x',avg > 0 ? 'فروش': 'خرید')
      .replace('x',Math.abs(avg))
      .replace('x',toman(bill.awkwardness.awk))
      .replace('x',toman(bill.awkwardness.sellprice))
  }

  res = sample
  .replace('x',user.name)
  .replace('x',bill.isSell ? '🔴' :'🔵')
  .replace('x',bill.isSell ? 'فروش' :'خرید')
  .replace('x',bill.amount)
  .replace('x',bill.price)
  .replace('x',final)
  .replace('x',ft)
  .replace('x',toman(user.charge))
  .replace('z',awkpart)

  return res
}

module.exports = {
  billToSring,
  buyerBillToString,
  sellerBillToString
}
