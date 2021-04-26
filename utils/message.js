const moment = require("moment");

async function formatMessage(username, text) {
    return await {
        username,
        text,
        time: moment().format("hh:mm A"),
    };
}

module.exports = formatMessage;
