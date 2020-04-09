require('console-stamp')(console, 'yyyy/mm/dd HH:MM:ss');
let path = require('path')

Object.assign(process.env,require('dotenv').config({path: path.join(__dirname,'base.env')}))

require('./src/app')

