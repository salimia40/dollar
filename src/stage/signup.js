const config = require('../config')
const { keys } = config
const helpers = require('../helpers')
const telegraf = require('telegraf')
const Scene = require('telegraf/scenes/base')
const User = require('../model/User')
const Markup = require('telegraf/markup')
const { leave } = require('telegraf/stage')

const singnupScene = new Scene('singnupScene')

const inputHandler = async (ctx, next) => {
  let user = ctx.user
  let asked = false
  if (ctx.session.skipBank == undefined) {
    ctx.session.skipBank = false
  }
  /**update user information based on user stage */
  switch (ctx.session.stage) {
    case 'justJoined':
      ctx.session.skipBank = false
      ctx.session.docsConfirmed = false
      break
    case 'nameAsked':
      user.name = ctx.message.text
      user = await user.save()
      break
    case 'usernameAsked':
      if (helpers.justPersian(ctx.message.text)) {
        user.username = ctx.message.text
        user = await user.save()
      } else {
        asked = true
        ctx.reply('لطفا فقط از کاراکتر های فارسی استفاده کنید')
      }
      break
    case 'phoneAsked':
      user.phone = ctx.message.text
      user = await user.save()
      break
    case 'bankNameAsked':
      if (!ctx.session.skipBank) {
        if (user.bank == undefined) {
          user.bank = {
            name: ctx.message.text
          }
        } else {
          user.bank.name = ctx.message.text
        }
        await ctx.reply('لطفا شماره حساب خود را وارد کنید')
        asked = true
        ctx.session.stage = 'bankNumberAsked'
        user = await user.save()
      }
      break
    case 'bankNumberAsked':
      user.bank.number = ctx.message.text
      user = await user.save()
      break
    case 'docsAsked':
      if (!ctx.session.docsConfirmed) {
        user.docs.push(ctx.message.photo[ctx.message.photo.length - 1].file_id)
        user = await user.save()
        asked = true
      }
      break
  }
  /**ask for eccount information */
  if (!asked) {
    console.log(user.bank)
    console.log(ctx.session.stage)
    console.log(ctx.session.docsConfirmed)

    if (user.name == undefined) {
      ctx.reply('لطفا نام و نام خانوادگی خود را واردکنید')
      ctx.session.stage = 'nameAsked'
    } else if (user.username == undefined) {
      ctx.reply(
        'لطفا نام کاربری خود را وارد کنید \n (معاملات شما با این نام در گروه نمایش داده می شود)'
      )
      ctx.session.stage = 'usernameAsked'
    } else if (user.phone == undefined) {
      ctx.reply('لطفا شماره تماس خود را وارد کنید')
      ctx.session.stage = 'phoneAsked'
    } else if (
      (user.bank.name == undefined || user.bank.number == undefined) &&
      (ctx.session.stage != 'bankNumberAsked' && !ctx.session.skipBank)
    ) {
      ctx.reply(
        'لطفا نام بانک خود را وارد کنید',
        Markup.inlineKeyboard([
          [
            {
              text: 'بعدا وارد میکنم',
              callback_data: 'skipBank'
            }
          ]
        ])
          .resize()
          .extra()
      )
      ctx.session.stage = 'bankNameAsked'
    } 
    // else if (user.docs.length == 0 && !ctx.session.docsConfirmed) {
    //   ctx.session.stage = 'docsAsked'
    //   await ctx.reply(
    //     'لطفا مدارک خود را  به صورت تصویر ارسال  کنید ( کپی کارت ملی یا پروانه کسب یا صفحه اول شناسنامه یا کارت پایان خدمت) و هنگام اتمام دکمه ثبت را بزنید:',
    //     {
    //       reply_markup: {
    //         inline_keyboard: [
    //           [
    //             {
    //               text: 'ثبت مدارک',
    //               callback_data: 'confirm-docs'
    //             }
    //           ]
    //         ]
    //       }
    //     }
    //   )
    // } 
    else if (!user.acceptedTerms) {
      await helpers.asyncForEach(config.contract, async c => {
        await ctx.reply(c)
      })
      // await ctx.reply(config.contract[2])
      await ctx.reply('آیا با قوانین و شرایط معاملاتی گروه موافق هستید؟؟', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'قبول میکنم',
                callback_data: 'terms-accept'
              }
            ],
            [
              {
                text: 'خیر',
                callback_data: 'terms-decline'
              }
            ]
          ]
        }
      })
    } else {
      /**user eccount is complete */
      await ctx.reply(await helpers.userToString(ctx))
      ctx.session.stage = 'completed'
      user.stage = 'completed'
      await user.save()
      delete ctx.session.skipBank
      next()
    }
  }
}

singnupScene.action(
  'skipBank',
  (ctx, next) => {
    ctx.session.skipBank = true
    next()
  },
  inputHandler
)

singnupScene.action(
  'noInvite',
  (ctx, next) => {
    next()
  },
  inputHandler
)

singnupScene.action(
  'terms-accept',
  async (ctx, next) => {
    ctx.user.stage = 'completed'
    ctx.user.acceptedTerms = true
    ctx.user.save()
    ctx.deleteMessage()
    if (ctx.user.confirmed) {
      ctx.reply(
        'شما با شرایط گروه موافقط کردید',
        Markup.keyboard([
          [keys.openfacts, keys.monthlyReport],
          [keys.postSettleReport, keys.semiSettle],
          [keys.packInv, keys.changeInv],
          [keys.userInfo, keys.contact]
        ])
          .resize()
          .extra()
      )
    } else {
      var owner = await User.findOne({
        role: config.role_owner
      })
      if (owner != undefined) {
        ctx.telegram.sendMessage(
          owner.userId,
          `
کاربر جدید با نام ${ctx.user.name}
کد کاربری ${ctx.user.userId}
شماره تماش ${ctx.user.phone}
 ثبت نام کرده است در صورت موافقت میتواند به فعالیت در ربات بپردازد
            `,
          Markup.inlineKeyboard([
            [
              {
                text: 'موافقت',
                callback_data: `accept-signup:${ctx.user.userId}`
              },
              {
                text: 'در کردن',
                callback_data: `decline-signup:${ctx.user.userId}`
              }
            ]
          ])
            .resize()
            .extra()
        )
        ctx.user.docs.forEach(pid => {
          ctx.telegram.sendPhoto(owner.userId, pid, {
            caption: `مدرک ارسالی کاربر ${ctx.user.name}`
          })
        })
        ctx.reply(
          'ثبت نام شما با موفقیت انجام شد و در صورت تایید مدیریت ربات به شما اطلاع داده خواهد شد'
        )
      } else {
        ctx.reply(`
ربات در حال حاظر مدیر ندارد درصورت تمایل میتوانید با ارسال دستور /init به مدیر ربات تبدیل شوید
            `)
      }
    }

    next()
  },
  leave()
)

singnupScene.action('terms-decline', ctx => {
  ctx.reply(
    'متاسفانه برای فعالیت در گروه باید با قوانین و شرایط گروه موافقت کنید.'
  )
})

singnupScene.action(
  'confirm-docs',
  (ctx, next) => {
    ctx.session.docsConfirmed = true
    next()
  },
  inputHandler
)

singnupScene.enter(async ctx => {
  console.log('inside signup bot')
  if (ctx.user.name == undefined) {
    ctx.reply(
      'لطفا نام و نام خانوادگی  خود را واردکنید (مشخصات وارد شده باید با مشخصات مندرج بر کارت بانکی شما یکسان باشد)'
    )
    ctx.session.stage = 'nameAsked'
  }
})
singnupScene.on('text', inputHandler, leave())
singnupScene.on('photo', inputHandler, leave())

module.exports = singnupScene
