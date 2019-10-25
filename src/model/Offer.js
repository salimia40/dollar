const mongoose = require("./_db");
const Schema = mongoose.Schema;

const schema = new Schema({
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
    expired: {
        type: Boolean,
        default: false
    },
    sellAsWhole: {
        type: Boolean,
        default: false
    },
    date: {
        type: Number,
        default: Date.now()
    },
    amount: {
        type: Number,
        required: true
    },
    left: {
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

const Offer = mongoose.model( "Offer", billSchema)

module.exports = Offer