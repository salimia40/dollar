const mongoose = require("./_db");
const Setting = require("./Setting");
const Schema = mongoose.Schema;

const billSchema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    isSell: {
        type: Boolean,
        default: true
    },
    condition: {
        type: String,
        default: 'عادی'
    },
    settled: {
        type: Boolean,
        default: false
    },
    expired: {
        type: Boolean,
        default: false
    },
    // sellAsWhole: {
    //     type: Boolean,
    //     default: false
    // },
    code: {
        type: Number,
        default: Setting.getCode()
    },
    type: {
        type: Number,
        default: 0
    },
    due: {
        type: Number,
        default: 0
    },
    profit: {
        type: Number,
        default: 0
    },
    commition: {
        type: Number,
        default: 0
    },
    awkwardness: {
        awk: Number,
        sellprice: Number
    },
    closed: {
        type: Boolean,
        default: false
    },
    date: {
        type: Number,
        default: Date.now()
    },
    sellerId: {
        type: Number
    },
    buyerId: {
        type: Number
    },
    amount: {
        type: Number,
        required: true
    },
    sells: [{
        price: Number,
        amount: Number,
    }],
    left: {
        type: Number,
        default: 0
    },
    avrage: {
        type: Number,
        default: 0
    },
    messageId: {
        type: Number
    },
    price: {
        type: Number,
        required: true
    }
})

billSchema.methods.sell = function (sell) {
    var {
        am,
        price,
        comm
    } = sell
    var commition = 0
    var profit = 0
    var sold = 0
    var closed = false
    var left = this.left
    if(am > 0){

        if (am >= left) {
            this.sells.push({
                amount: left,
                price
            })
            am -= left
            sold = left
            this.left = 0
            
            // count profit of this bill
            var l = 0
            var sum = 0
            var ams = 0
            
            while (l < this.sells.length) {
                var s = this.sells[l++]
                var x = 0
                if (this.isSell) {
                    x = this.price - s.price
                } else
                x = s.price - this.price
                
                if(s.amount == undefined) {
                    s.amount = 1
                }

                ams += s.amount
                x *= s.amount
                sum += x
            }
            sum *= 1000

            this.profit = sum
            this.commition = comm * ams
            closed = true
        } else {
            left -= am
            this.sells.push({
                amount: am,
                price
            })
            sold = am
            am = 0
            this.left = left
        }
        
        // count profit for this sell this one will be returned

        if (this.isSell) {
            profit = this.price - price
        } else
        profit = price - this.price
        profit *= sold
        profit *= 1000
        
        commition = sold * comm
    }
    
    return {am,commition,profit,closed}
}

billSchema.methods.close = function (conf) {
    var {
        comm,
        price
    } = conf
    var commition = 0
    var profit = 0
    var am = 0
    if (this.left > 0) {
        var z = this.left
        
        this.sells.push({
            price,
            amount: this.left
        })
        am = this.left
        this.left = 0
        var sum = 0
        var ams = 0

        if (this.isSell) {
            profit = this.price - price
        } else
            profit = price - this.price

        // current sell profit
        profit *= z
        profit *= 1000

        commition = z * comm


        // bills profit
        this.sells.forEach(sell => {
            var x = 0
            if (this.isSell) {
                x = this.price - sell.price
            } else
                x = sell.price - this.price

            if (sell.amount == undefined) {
                sell.amount = 1
            }
            ams += sell.amount
            x *= sell.amount
            sum += x
        })

        sum *= 1000

        this.profit = sum
        this.commition = comm * ams

    }

    if (this.isSell) am = 0 - am
    return {
        profit,
        commition,
        am
    }
}

const Bill = mongoose.model("Bill", billSchema)

module.exports = Bill