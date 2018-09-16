const jrfws = require('../app').jrfws;
const groups = require('../models/groups');
const users = require('../models/users');

async function broadcastAllClients(data, route, act) {

    await jrfws.broadcast('all', data, route, act);

}

async function broadcastAllClientsExcept(data, clients, route, act) {

    await jrfws.broadcastExcept('all', clients, data, route, act);

}

async function broadcastGroup(group, data, route, act) {

    await jrfws.broadcast(group, data, route, act);

}

async function broadcastGroupExcept(group, clients, data, route, act) {

    await jrfws.broadcastExcept(group, clients, data, route, act);

}

async function sendMesUsersGroup(group, data, route, act) {
    await _sendMesUsersGroup(group, data, route, act);
}

async function sendMesUsersGroupExcept(except, group, data, route, act) {
    await _sendMesUsersGroup(group, data, route, act, except);
}

async function _sendMesUsersGroup(group, data, route, act, except) {

    if (!group) {
        return;
    }

    let usersToMes;
    let res = await groups.getGroups(group, true);
    if (!res || !res.length) {
        return;
    }
    usersToMes = res[0].users;

    if (!Array.isArray(usersToMes)) {
        return;
    }

    for (let client of jrfws.wss.clients) {

        if (except) {
            if (except === client) {
                continue;
            }
        }

        if (!client.user) {
            continue;
        }

        let id = client.user._id.toString();
        if (!usersToMes.includes(id)) {
            continue;
        }

        await client.sendMes(data, route, act);

    }

}

async function sendMesToUser(user, data, route, act) {

    if (!user) {
        return;
    }

    let res = await users.getUsers(user, true);
    if (!res || !res.length) {
        return;
    }
    let userToMes = res[0];

    for (let client of jrfws.wss.clients) {

        if (!client.user) {
            continue;
        }

        if (userToMes._id.toString() === client.user._id.toString()) {
            await client.sendMes(data, route, act);
            break;
        }

    }

}

async function access(data, stop) {

    let resData = {
        okay: true,
        description: ''
    };

    if (data.client.user) {
        return;
    }
    resData.okay = false;
    resData.description = 'Invalid access';
    await stop();
    await data.client.sendMes(resData, data.route, data.act);
}

module.exports = {
    broadcastAllClients,
    broadcastAllClientsExcept,
    broadcastGroup,
    broadcastGroupExcept,
    access,
    sendMesUsersGroup,
    sendMesUsersGroupExcept,
    sendMesToUser
};