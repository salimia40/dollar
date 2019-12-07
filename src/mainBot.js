
  const Telegraf = require('telegraf'),
  config = require('./config'),
  bot = new Telegraf(config.token)

  module.exports = bot
  