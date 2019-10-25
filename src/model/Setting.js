
const ex = () => {
    const fs = require('fs')
    const path = './setting.json'
    const def = {
        quotation: 1800,
        tolerence: 5,
        delay: 60,
        code: 100000,
        commition: 10,
        baseCharge: 1150,
        active: true,
        showFacts: true,
        vipOff: 50,
        cashReq: false, 
    }
    var setting
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, JSON.stringify(def))
    }
    setting = JSON.parse(fs.readFileSync(path))
    setting = Object.assign(def,setting)
    console.log(setting)
    const save = () => {
        fs.writeFileSync(path, JSON.stringify(setting))
    }
    
    const toYes = (bool = true) => {
        return bool ? 'بله' : 'خیر'
    }

    return {
        getCode: () => {
            let c = setting.code++
            save()
            return c
        },
        getQuotation: () => {
            return setting.quotation
        },
        setQuotation: (v) => {
            setting.quotation = v
            save()
        },
        getCashReq: () => {
            return setting.cashReq
        },
        setCashReq: (v) => {
            setting.cashReq = v
            save()
        },
        setCard: (v,s,z) => {
            setting.card = v
            setting.shaba = s
            setting.owner = z
            save()
        },
        getCard: () => {
            return {
                card : setting.card,
                shaba : setting.shaba,
                owner : setting.owner,
            }
        },
        getCardString: () => {
            return `
شماره کارت ${setting.card}
شماره شبا ${setting.shaba}
نام صاحب حساب ${setting.owner}
            `
        },
        getDelay: () => {
            return setting.delay
        },
        setDelay: (v) => {
            setting.delay = v
            save()
        },
        getTolerance: () => {
            return setting.tolerence
        },
        setTolerence: (v) => {
            setting.tolerence = v
            save()

        },
        getCommition: () => {
            return setting.commition
        },
        setCommition: (v) => {

            setting.commition = v
            save()
        },
        getBaseCharge: () => {
            return setting.baseCharge
        },
        setBaseCharge: (v) => {
            setting.baseCharge = v
            save()
        },
        getActiveGroup: () => {
            return setting.group
        },
        setActiveGroup: (v) => {
            setting.group = v
            save()
        },
        getLastQM: () => {
            return setting.lastQM
        },
        setLastQM: (v) => {
            setting.lastQM = v
            save()
        },
        getVipOff: () => {
            return setting.vipOff
        },
        setVipOff: (v) => {
            setting.vipOff = v
            save()
        },
        itsActiveGroup: (v) => {

            let bool = false
            if (setting.group != undefined && setting.group == v) bool = true
            return bool
        },
        IsActive: () => {
            return setting.active
        },
        activate: () => {
            setting.active = true
            save()
        },
        deActivate: () => {
            setting.active = false
            save()
        },
        showFacts: () => {
            setting.showFacts = true
            save()
        },
        dontShowFacts: () => {
            setting.showFacts = false
            save()
        },
        shouldShowFacts: () => {
            return setting.showFacts
        },
        toString : () => {
            return `
تنضیمات فعلی ربات:

وجه تضمین : ${setting.baseCharge}
کمیسیون : ${setting.commition}
تلورانس : ${setting.tolerence}
فعال بودن : ${toYes(setting.active)}
نمایش در کروه : ${toYes(setting.showFacts)} 
اعتبار لفظ : ${setting.delay}
مظنه : ${setting.quotation}
تخفیف کاربران vip : ${setting.vipOff} %
            `
        },
        self: () => {
            return setting
        }
    }
}

module.exports = ex()