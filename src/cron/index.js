const {
    CronJob,
    CronTime
} = require('cron')
const Setting = require('../model/Setting')
const timeZone = 'Asia/Tehran'

const deActivationSchedule = new CronJob('00 00 00 * * *', async () => {    
    Setting.deActivate()
}, null, true, timeZone)

const activationSchedule = new CronJob('00 00 10 * * *', async () => {
    Setting.activate()
}, null, true, timeZone)

module.exports = {
    updateActivationtime: (t) => {
        activationSchedule.setTime(new CronTime(`00 00 ${t} * * *`, timeZone))
    },
    updateDeActivationtime: (t) => {
        deActivationSchedule.setTime(new CronTime(`00 00 ${t} * * *`, timeZone))
    }
}