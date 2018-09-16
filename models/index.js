const jrfdb = require('jrfdb');

async function initDB(portMongoDB = 26000, nameDB = 'jrfChatExample') {

    await jrfdb.addScheme(require('./users').users);
    await jrfdb.addScheme(require('./groups').groups);
    await jrfdb.addScheme(require('./messages').messages);

    let connect = {port: portMongoDB, db: nameDB};
    await jrfdb.setConnection(connect);
    let res = await jrfdb.connect();

    await require('./groups').addGroup('All users');

    console.log(`Init db: ${res}`);
    return res;

}



module.exports = {
    initDB
};