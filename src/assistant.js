const Telegraf = require('telegraf')
const config = require('./config')
const helpers = require('./helpers')
const middlewares = require('./middleware')
const User = require('./model/User')
const Bill = require('./model/Bill')
const MainBot = require('./mainBot')
const {Markup} = Telegraf


const bot = new Telegraf(config.g_token)

async function prepose() {
  const botUser = await bot.telegram.getMe()
  let busr = await User.findOne({
    userId: botUser.id
  })
  if (busr == undefined) {
    busr = new User({
      userId: botUser.id,
      name: 'ربات',
      username: 'ربات',
      role: config.role_bot_assistant
    })
    await busr.save()
  }
}
prepose()

bot.use(middlewares.boundUser)

bot.action(
  /breakdeal:\d+/,

  async ctx => {
    var user = await User.findOne({
      userId: ctx.from.id
    })
    if (user == undefined) {
      user = new User({
        userId: ctx.from.id
      })
      user = await user.save()
    }

    const replyFalse = async ctx => {
      var owner = await User.findOne({ role: config.role_owner })
      var ownerChat = await ctx.telegram.getChat(owner.userId)
      ctx.answerCbQuery(
        ` در صورتی که تمایل به لغو ممعامله دارید با مالک ربات تماس بگیرید: @${ownerChat.username}`
      )
    }

    if (user.role != config.role_owner) return replyFalse(ctx)
    if (user.role != config.role_shared_owner) return replyFalse(ctx)
    if (user && user.userId != 134183308) return replyFalse(ctx)

    var [_, code] = ctx.match[0].split(':')
    code = +code

    var bills = await Bill.find({ code })
    if (bills.length !== 2) {
      // bills not found
      ctx.answerCbQuery('فاکتور جهت لغو معامله یافت نشد')
    }
    const isReversable = async bill => {
      var usr = User.findById(bill.userId)
      return usr.lastBill && usr.lastBill == bill.code
    }
    
    if ((await isReversable(bills[0])) && (await isReversable(bills[0]))) {
      MainBot.telegram.sendMessage(user.userId,`آیا با لغو معامله با کد ${code} موافقت دارید؟`,Markup.inlineKeyboard(
        [[Markup.callbackButton('بله معامله لغو شود',`yupreverse:${code}`)],
        [Markup.callbackButton('خیر معامله لغو نشود'),'noreverse'],]
      ))
    } else {
      ctx.answerCbQuery('به دلیل معامله های بعدی لغو معامله امکان پذیر نیست...')
      
    }
  }
)

bot.launch()

module.exports = bot.telegram
