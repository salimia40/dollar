const pug = require('pug')

const users = pug.compileFile('./pugs/users.pug')
const openBills = pug.compileFile('./pugs/openBills.pug')
const monthlyReport = pug.compileFile('./pugs/openBills.pug')
const postSettleReport = pug.compileFile('./pugs/openBills.pug')
const transactions = pug.compileFile('./pugs/openBills.pug')