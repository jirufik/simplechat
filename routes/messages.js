const users = require('../models/users');
const groups = require('../models/groups');
const messages = require('../models/messages');
const middleware = require('../middleware');

async function add(data, stop) {

    let resData = {
        okay: false,
        description: ''
    };

    if (!data.data.mes) {
        resData.description = 'Invalid message';
        await stop();
        await data.client.sendMes(resData, 'messages', 'add');
        return;
    }
    let mes = data.data.mes;

    let res = await messages.add(mes);
    if (!res) {
        resData.description = 'Invalid message';
        await stop();
        await data.client.sendMes(resData, 'messages', 'add');
        return;
    }

    resData.okay = true;
    resData.mes = res;
    await data.client.sendMes(resData, 'messages', 'add');

    if (mes.toGroup) {
        await middleware.sendMesUsersGroupExcept(data.client, mes.toGroup, {mes: res}, 'messages', 'add');
    }

    if (mes.toUser) {
        await middleware.sendMesToUser(mes.toUser, {mes: res}, 'messages', 'add');
    }

}

async function get(data, stop) {

    let resData = {
        okay: false,
        description: ''
    };

    if (!data.data.query) {
        resData.description = 'Invalid query';
        await stop();
        await data.client.sendMes(resData, 'messages', 'get');
        return;
    }

    let query = data.data.query;
    let res = await messages.get(query);

    if (!res) {
        resData.description = 'Invalid query';
        await stop();
        await data.client.sendMes(resData, 'messages', 'get');
        return;
    }

    resData.okay = true;
    resData.mes = res;
    await data.client.sendMes(resData, 'messages', 'get');

}

async function hardReset() {
    await  messages.hardReset();
}

module.exports = {
    add,
    get,
    hardReset
};
