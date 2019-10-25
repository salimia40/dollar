const mongoose = require("./_db");
const Setting = require("./Setting");
const Schema = mongoose.Schema;

const settleSchema = new Schema({
    code: {
        type: Number,
        default: Setting.getCode()
    },
    date: {
        type: Number,
        default: Date.now()
    },
    userId: {
        type: Number,
    },
    profit: {
        type: Number,
    },
    commition: {
        type: Number,
    },
    price: {
        type: Number,
        required: true
    }
})

const Settle = mongoose.model( "Settle", settleSchema)

module.exports = Settle