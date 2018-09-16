const groups = require('../models/groups');
const middleware = require('../middleware');

async function add(data, stop) {

    let resData = {
        okay: false,
        description: ''
    };

    if (!data.data.group) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups', 'add');
        return;
    }

    let group = data.data.group;
    if (!group.name) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups', 'add');
        return;
    }

    let res = await groups.addGroup(group.name, group.users);
    if (!res) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups', 'add');
        return;
    }

    resData.okay = true;
    resData.group = res;
    await data.client.sendMes(resData, 'groups', 'add');
    await middleware.sendMesUsersGroupExcept(data.client, group.name, {group: res}, 'groups', 'add');

}

async function del(data, stop) {

    let resData = {
        okay: false,
        description: ''
    };

    if (!data.data.group) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups', 'del');
        return;
    }

    let group = data.data.group;
    if (!group.name) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups', 'del');
        return;
    }

    let res = await groups.delGroup(group);
    if (!res) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups', 'del');
        return;
    }

    resData.okay = true;
    resData.group = res;
    await data.client.sendMes(resData, 'groups', 'del');
    let users = res.users.map(user => user._id.toString());
    await middleware.sendMesUsersGroupExcept(data.client, {users}, {group: res}, 'groups', 'del');

}

async function get(data, stop) {

    let resData = {
        okay: false,
        description: ''
    };

    if (!data.data) {
        data.data = {
            group: null
        }
    }

    let group = data.data.group;

    let res = await groups.getGroups(group);

    if (!res) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups', 'get');
        return;
    }

    resData.okay = true;
    resData.groups = res;
    await data.client.sendMes(resData, 'groups', 'get');

}

async function addUsers(data, stop) {

    let resData = {
        okay: false,
        description: ''
    };

    if (!data.data.group) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups.users', 'add');
        return;
    }

    if (!data.data.group.users) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups.users', 'add');
        return;
    }

    if (!Array.isArray(data.data.group.users)) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups.users', 'add');
        return;
    }

    let group = data.data.group;
    if (!group.name) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups.users', 'add');
        return;
    }

    let res = await groups.addUsers(group, group.users);
    if (!res) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups.users', 'add');
        return;
    }

    resData.okay = true;
    resData.group = res.group;
    resData.users = res.users;
    await data.client.sendMes(resData, 'groups.users', 'add');
    if (res.users.length) {
        await middleware.sendMesUsersGroupExcept(data.client, group.name, res, 'groups.users', 'add');
    }

}

async function delUsers(data, stop) {

    let resData = {
        okay: false,
        description: ''
    };

    if (!data.data.group) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups.users', 'del');
        return;
    }

    if (!data.data.group.users) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups.users', 'del');
        return;
    }

    if (!Array.isArray(data.data.group.users)) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups.users', 'del');
        return;
    }

    let group = data.data.group;
    if (!group.name) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups.users', 'del');
        return;
    }

    let res = await groups.delUsers(group, group.users);
    if (!res) {
        resData.description = 'Invalid group';
        await stop();
        await data.client.sendMes(resData, 'groups.users', 'del');
        return;
    }

    resData.okay = true;
    resData.group = res.group;
    resData.users = res.users;
    await data.client.sendMes(resData, 'groups.users', 'del');
    if (res.users.length) {
        await middleware.sendMesUsersGroupExcept(data.client, group.name, res, 'groups.users', 'del');
    }

}

async function hardReset() {
    await  groups.hardReset();
}

module.exports = {
    add,
    del,
    get,
    addUsers,
    delUsers,
    hardReset
};