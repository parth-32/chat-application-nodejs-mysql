const moment = require('moment')

async function formatMessage(username, text){
    return await{
        username,
        text,
        time : moment().format('DD/MM/YYYY, hh:mm A')
    }
}

module.exports = formatMessage