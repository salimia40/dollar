var id = 10
const newId = () => id++

function randomInterval(min, max, callback, startDelay = 0) {
    var stopped = true

    function loop() {
        var rand = Math.round(Math.random() * (max - min)) + min;
        setTimeout(function () {
            callback()
            if (!stopped)
                loop()
        }, rand)
    }
    var stop = function () {
        stopped = true
    }
    var start = function () {
        if (stopped) {
            loop()
            stopped = false
        }
        console.log('started')
    }

    setTimeout(start, startDelay)

    return {
        start,
        stop
    }
}

function Faker(
    timeMin = 200,
    timeMax = 2000,
    offerExpire = 20000,
    dealDeley = 10,
    maxAmount = 10,
    maxInv = 20,
    announceDeal,
    announceOffer,
    getPrice,
    codeProvider,
    names
) {

    function Offer(userId, amount, isSell, price, name, offerExpire, onExpire) {
        this.id = newId()
        this.userId = userId
        this.amount = amount
        this.isSell = isSell
        this.offerExpire = offerExpire
        this.price = price
        this.name = name
        this.sold = 0
        this.mid = null
        this.expired = false
        this.expire = function () {
            if (!this.expired) {
                this.expired = true
                onExpire(this.id)
            }
        }
        setTimeout(() => {
            this.expire()
        }, this.offerExpire)
    }

    function Deal(sellerId, buyerId, seller, buyer, amount, price) {
        this.seller = seller
        this.sellerId = sellerId
        this.buyer = buyer
        this.buyerId = buyerId
        this.amount = amount
        this.price = price
        this.date = Date.now()
        this.code = codeProvider()
    }

    function Dealer(name) {
        this.name = name
        this.inventory = 0
        this.offerExpire = offerExpire
        this.id = newId()
        this.makeOffer = function (onExpire) {
            var amount = Math.round(Math.random() * (maxAmount - 1)) + 1
            var isSell
            if (this.inventory > maxInv)
                isSell = true
            else if (this.inventory < (0 - maxInv))
                isSell = false
            else
                isSell = Math.round(Math.random()) == 1

            var price = getPrice(isSell)

            return new Offer(this.id, amount, isSell, price, this.name, this.offerExpire, onExpire)
        }
        this.makeDeal = function (offer) {
            var amount
            if (offer == undefined) {
                var isSellMatters = true
                var isSell = true
                if (this.inventory > maxInv)
                    isSell = true
                else if (this.inventory < (0 - maxInv))
                    isSell = false
                else
                    isSellMatters = false

                offer = offers.getRandomOffer(isSellMatters, isSell)
                amount = Math.round(Math.random() * (offer.amount - 1)) + 1
            } else {
                amount = offer.amount
            }

            if (offer == 0) return 0
            if (this.id == offer.userId) return 0

            var oppo = dealers.getDealerById(offer.userId),
                seller, sellerId, buyer, buyerId
                
            if (offer.isSell) {
                oppo.inventory -= amount
                this.inventory += amount
                seller = oppo.name
                sellerId = oppo.id
                buyer = this.name
                buyerId = this.id
            } else {
                oppo.inventory += amount
                this.inventory -= amount
                seller = this.name
                sellerId = this.id
                buyer = oppo.name
                buyerId = oppo.id
            }

            offer.amount -= amount
            if (offer.amount == 0)
                offer.expire()

            var deal = new Deal(sellerId, buyerId, seller, buyer, amount, offer.price)
            return deal
        }

    }

    const dealers = new Array()
    dealers.getDealerById = function (id) {
        return this.find(dealer => dealer.id == id)
    }
    dealers.getRandomDealer = function () {
        return this[Math.round(Math.random() * (dealers.length - 1))]
    }
    names.forEach((name) => dealers.push(new Dealer(name)))
    const offers = new Array()
    offers.removeExpiredOffer = function (id) {
        var index = this.findIndex((offer) => offer.id == id)
        if (index == -1) return
        var rest = this.slice(index + 1)
        this.length = index
        this.push.apply(this, rest)
    }

    offers.getRandomOffer = function (isSellMatters = false, isSell = true) {

        var valid = false
        if (this.length == 0) return 0
        var random
        var unlucky = 0

        while (!valid) {
            random = this[Math.round(Math.random() * (dealers.length - 1))]
            if (random != undefined) {
                if (isSellMatters && random.isSell == !isSell && !random.expired) valid = true
                else if (!random.expired) valid = true
            }
            if (!valid) {
                if (unlucky > 10) {
                    random = 0
                    valid = true
                }
                unlucky++
            }
        }

        return random
    }

    offers.getOfferByMid = function (mid) {
        return this.find(offer => offer.mid == mid)
    }

    var stopped = true
    var exp = 0
    randomInterval(timeMin, timeMax, () => {
        if (!stopped) {
            var bool = false
            if (exp > dealDeley) {
                bool = Math.round(Math.random() * 2) == 1
            } else {
                exp++
            }
            if (bool) {
                var deal = dealers.getRandomDealer().makeDeal()
                if (deal != 0)
                    announceDeal(deal)
                else {
                    exp = 5
                }
            } else {
                var offer = dealers.getRandomDealer().makeOffer(id => offers.removeExpiredOffer(id))
                announceOffer(offer)
                offers.push(offer)
            }
        }
    }, 400)

    const forceDeal = function (mid) {
        var offer = offers.getOfferByMid(mid)
        if (offer != undefined) {
            var dealer
            while (dealer == undefined) {
                var temp = dealers.getRandomDealer()
                if (temp.id != offer.userId) dealer = temp
            }
            var deal = dealer.makeDeal(offer)
            if (deal != 0)
                announceDeal(deal)
        }
    }

    return {
        start: () => {
            stopped = false
        },
        stop: () => {
            stopped = true
        },
        forceDeal
    }
}

// Faker()
module.exports = Faker