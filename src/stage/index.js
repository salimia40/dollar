const Stage = require('telegraf/stage')

const stage = new Stage(
    [
        require('./signup'),
        require('./summitFish'),
        require('./cashReq'),
        require('./commition'),
        require('./tolerance'),
        require('./quotation'),
        require('./delay'),
        require('./sendToGroup'),
        require('./sendToUsers'),
        require('./icrease'),
        require('./promote'),
        require('./settle'),
        require('./vipoff'),
        require('./reqRESIVEGOLG'),
        require('./gift'),
        require('./basecharge'),
        require('./decrease'),
        require('./support'),
        require('./replyUser'),
        require('./viewUser'),
        require('./msgEccountant'),
        require('./summitBotCard'),
        require('./userEditor'),
        require('./docs'),
        require('./semiSettle'),
    ], {
        ttl: 31104000
    }
)


module.exports = stage