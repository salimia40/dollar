const User = require('../model/User')
const helpers = require('../helpers')
const hears = require('../hear')
const config = require('../config')

module.exports = {
    init: async (ctx, next) => {
        let role = config.role_owner
        var count = await User.countDocuments({
            role
        })
        if (count == 0) {
            ctx.user.role = role
            ctx.user.confirmed = true
            await ctx.user.save()
            ctx.reply('تبریک شما مالک ربات هستید')
            next()
        }
    },
    start: async (ctx, next) => {
        console.log('start cmd')
        if (helpers.isPrivate(ctx)) {
            if (ctx.user.stage == 'justJoined') {
                await ctx.reply(config.welcomeMessage)
                next()
            } else if (ctx.user.stage != 'completed') {
                next()
            } else {
                console.log('send main menu')
                hears.sendMainMenu(ctx)
            }
        }
    },
}