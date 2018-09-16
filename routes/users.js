const users = require('../models/users');
const groups = require('../models/groups');
const middleware = require('../middleware');

async function login(data, stop) {

    let resData = {
        okay: false,
        description: ''
    };

    if (!data.data.user) {
        resData.description = 'Invalid login';
        await stop();
        await data.client.sendMes(resData, 'users', 'login');
        return;
    }

    let user = data.data.user;
    let res = await users.getUsers(user);

    if (!res) {
        res = await users.addUser(user.name);
        if (!res) {
            resData.description = 'Invalid login';
            await stop();
            await data.client.sendMes(resData, 'users', 'login');
            return;
        }
        await groups.addUsers({name: 'All users'}, [res._id]);
        await middleware.broadcastAllClientsExcept(res, data.client, 'users', 'add');
    } else {
        res = res[0];
    }

    resData.okay = true;
    resData.user = res;
    data.client.user = res;
    await data.client.sendMes(resData, 'users', 'login');

}

async function add(data, stop) {

    let resData = {
        okay: false,
        description: ''
    };

    if (!data.data.user) {
        resData.description = 'Invalid user';
        await stop();
        await data.client.sendMes(resData, 'users', 'add');
        return;
    }

    let user = data.data.user;
    let res = await users.findUser(user);

    if (res) {
        resData.description = 'Invalid user';
        await stop();
        await data.client.sendMes(resData, 'users', 'add');
        return;
    }

    res = await users.addUser(user.name);
    if (!res) {
        resData.description = 'Invalid user';
        await stop();
        await data.client.sendMes(resData, 'users', 'add');
        return;
    }
    await groups.addUsers({name: 'All users'}, [res._id]);
    await middleware.broadcastAllClientsExcept(res, data.client, 'users', 'add');

    resData.okay = true;
    resData.user = res;
    await data.client.sendMes(resData, 'users', 'add');

}

async function del(data, stop) {

    let resData = {
        okay: false,
        description: ''
    };

    if (!data.data.user) {
        resData.description = 'Invalid user';
        await stop();
        await data.client.sendMes(resData, 'users', 'del');
        return;
    }

    let user = data.data.user;
    let res = await users.findUser(user);

    if (!res) {
        resData.description = 'Invalid user';
        await stop();
        await data.client.sendMes(resData, 'users', 'del');
        return;
    }

    await groups.delUsers({name: 'All users'}, [res._id]);
    res = await users.delUser(user);
    if (!res) {
        resData.description = 'Invalid user';
        await stop();
        await data.client.sendMes(resData, 'users', 'del');
        return;
    }

    await middleware.broadcastAllClientsExcept(res, data.client, 'users', 'del');

    resData.okay = true;
    resData.user = res;
    await data.client.sendMes(resData, 'users', 'del');

}

async function get(data, stop) {

    let resData = {
        okay: false,
        description: ''
    };

    if (!data.data) {
        data.data = {
            user: null
        }
    }

    let user = data.data.user;

    let res = await users.getUsers(user);
    if (!res) {
        resData.description = 'Invalid user';
        await stop();
        await data.client.sendMes(resData, 'users', 'get');
        return;
    }

    resData.okay = true;
    resData.users = res;
    await data.client.sendMes(resData, 'users', 'get');

}

async function hardReset() {
    await  users.hardReset();
}

module.exports = {
    login,
    add,
    get,
    del,
    hardReset
};