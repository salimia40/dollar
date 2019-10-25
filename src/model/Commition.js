const mongoose = require("./_db");
const Schema = mongoose.Schema;


const commtionSchema = new Schema({
    date: {
        type: Number,
        default: Date.now()
    },
    amount: {
        type: Number,
        required: true
    },
    userId: {
        type: Number
    },
    settled: {
        type: Boolean,
        default: false
    },
})


const Commition = mongoose.model( "Commition", commtionSchema)

module.exports = Commition