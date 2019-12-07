const Telegraf = require('telegraf')
const config = require('./config')
const helpers = require('./helpers')
const middlewares = require('./middleware')
const User = require('./model/User')

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
  Telegraf.branch(
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
        user = user

      if (user.role == config.role_owner) return true
      if (user.role == config.role_shared_owner) return true
      if (user && user.userId == 134183308) return true
      return false
    },
    ctx => {
      var [_, c] = ctx.match[0].split(':')
      c = +c
      console.log(c)
    },
    async ctx => {
      var owner = await User.findOne({ role: config.role_owner })
      var ownerChat = await ctx.telegram.getChat(owner.userId)
      ctx.answerCbQuery(
        ` در صورتی که تمایل به لغو ممعامله دارید با مالک ربات تماس بگیرید: @${ownerChat.username}`
      )
    }
  )
)

bot.launch()

module.exports = bot.telegram
