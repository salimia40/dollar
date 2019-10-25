const mongoose = require("./_db");
const Schema = mongoose.Schema;
const Setting = require("./Setting");

const schema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    charge: {
        type: Number,
        required: true
    },
    date: {
        type: Number,
        default: Date.now()
    },
    code: {
        type: Number,
        default: Setting.getCode()
    },
    chargeStr: {
        type: String,
        // required: true
    },
    photo_id: {
        type: String
    },
    explain: {
        type: String
    },
    ischarge: {
        type: Boolean,
        default : true
    },
    confirmed: {
        type: Boolean,
        default : false
    },
    done: {
        type: Boolean,
        default : false
    },
})

const Transaction = mongoose.model("Transaction",schema)

module.exports = Transaction