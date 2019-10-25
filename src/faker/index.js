const Faker = require('./faker')
const extra = require('telegraf/extra')
const markup = extra.HTML()
const setting = require('../model/Setting')
const assistant = require('../assistant')
const {
    toman,
    dateToString
} = require('../helpers')


const announceOffer = async (offer) => {
    let z
    let emo
    if (offer.isSell) {
        emo = '🔴'
        z = 'ف'

    } else {
        emo = '🔵'
        z = 'خ'
    }

    var msg = emo + '  ' + offer.name + ' <b> ' + offer.amount + ' ' + z + ' ' + offer.price + ' </b> ' + ''

    var res = await assistant.sendMessage(setting.getActiveGroup(), msg,
        markup
    )
    offer.mid = res.message_id

}


// const randomPrice = () => {
//     var min = 1830
//     var max = 1840
//     return Math.round(Math.random() * (max - min) + min)
// }

const priceProvider = (isSell) => {
    var q = setting.getQuotation()
    var t = setting.getTolerance()
    var min,max
    if (isSell == undefined) {
        min = q - t
        max = q + t
    } else {
        min = isSell ? q : q - t
        max = isSell ? q + t : q
    }
    
    return Math.round(Math.random() * (max - min) + min)
}

const codeProvider = () => {
    return setting.getCode()
}

const announceDeal = (deal) => {
    console.log(deal)
    var billPrev = `🔵 خریدار : x
🔴 فروشنده : x
✅ تعداد: x قیمت: x ✅
⏱ ساعت:  x
🔖 شماره حواله: x`

    var m = billPrev
        .replace('x', deal.buyer)
        .replace('x', deal.seller)
        .replace('x', deal.amount)
        .replace('x', toman(deal.price))
        .replace('x', dateToString(deal.date))
        .replace('x', deal.code)

    assistant.sendMessage(setting.getActiveGroup(), m)

}

const feed = [
//     'امیر آل عصفور',
// 'احسان قدمی',
// 'محمد بردبار',
// 'شکوفه افسر',
// 'رویا ارشادی',
// 'محمد جلوداری',
// 'مرضیه یزدانپناه',
// 'شوکت پارسا',
// 'پروین صالحی',
// 'نگین بازیار',
// 'احمد مولایی',
// 'آرش کریمی',
// 'فاطمه لیاقت',
// 'اکبر مومنی',
// 'علی مومنی',
// 'رضا میرضایی',
// 'نگین',
// 'ساغر',
// 'آسمان',
// 'دریا',
'نگین سهرابی',
'امیرحسین صادقی',
'مهدی ایمان',
'صادق امجدی',
'فرزاد امجدی',
'افسانه محمودی '
]

var faker = Faker(10000, 25000, 60000, 5, 10, 30, announceDeal, announceOffer, priceProvider,codeProvider, feed)
faker.stop()

module.exports = faker