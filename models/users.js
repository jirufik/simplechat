const jrfdb = require('jrfdb');

let users = {
    name: 'users',
    fields: {
        name: {
            description: 'Name',
            type: 'string',
            unique: true,
            min: 3,
            required: true
        }
    }
};

async function getUsers(users, usersIdOnly = false) {

    if (!users) {

        let find = {};

        let obj = {
            query: {
                find
            }
        };
        if (usersIdOnly) {
            obj.query.dbrefIdOnly = true;
        }

        let scheme = await jrfdb.getScheme('users');
        let res = await scheme.get(obj);
        if (!res.okay || !res.output.length) {
            return;
        }

        return res.output;

    }

    if (users && typeof users === 'string') {

        let find = {
            $or: [
                {name: users},
                {_id: users}
            ]
        };

        let obj = {
            query: {
                find
            }
        };
        if (usersIdOnly) {
            obj.query.dbrefIdOnly = true;
        }

        let scheme = await jrfdb.getScheme('users');
        let res = await scheme.get(obj);
        if (!res.okay || !res.output.length) {
            return;
        }

        return res.output;

    }

    if (typeof users === 'object' && Array.isArray(users)) {

        let findUsers = [];

        for (let user of users) {

            if (typeof user === 'string') {
                findUsers.push(user);
                continue;
            }

            if (typeof user === 'object' && user._id) {
                if (typeof user._id === 'string') {
                    findUsers.push(user._id);
                    continue;
                }
                findUsers.push(user._id.toString());
                continue;
            }

            if (typeof user === 'object' && user.name) {
                if (typeof user.name === 'string') {
                    findUsers.push(user.name);
                }
                continue;
            }

            if (typeof user === 'object') {
                findUsers.push(user.toString());
            }

        }

        if (!findUsers.length) {
            return;
        }

        let find = {
            $or: [
                {name: {$in: findUsers}},
                {_id: {$in: findUsers}}
            ]
        };

        let obj = {
            query: {
                find
            }
        };
        if (usersIdOnly) {
            obj.query.dbrefIdOnly = true;
        }

        let scheme = await jrfdb.getScheme('users');
        let res = await scheme.get(obj);
        if (!res.okay || !res.output.length) {
            return;
        }

        return res.output;

    }

    if (typeof users === 'object') {

        let find = {};
        if (users._id) {
            find._id = users._id;
        } else if (users.name) {
            find.name = users.name;
        }

        let obj = {
            query: {
                find
            }
        };

        if (usersIdOnly) {
            obj.query.dbrefIdOnly = true;
        }

        let scheme = await jrfdb.getScheme('users');
        let res = await scheme.get(obj);

        if (!res.okay || !res.output.length) {
            return;
        }

        return res.output;

    }

}

async function findUser(user) {

    let find = {};
    let badUser = true;
    if (user._id) {
        find._id = user._id;
        badUser = false;
    } else if (user.name) {
        find.name = user.name;
        badUser = false;
    }

    if (badUser) {
        return;
    }

    let obj = {
        query: {
            find
        }
    };

    let scheme = await jrfdb.getScheme('users');
    let res = await scheme.get(obj);
    if (!res.okay || !res.output.length) {
        return;
    }

    return res.output[0];
}

async function addUser(name) {

    let obj = {
        docs: {
            name
        }
    };

    let scheme = await jrfdb.getScheme('users');
    let res = await scheme.add(obj);
    if (!res.okay || !res.output.length) {
        return;
    }

    return res.output[0];

}

async function delUser(user) {

    let filter = {};
    let badUser = true;
    if (user._id) {
        filter._id = user._id;
        badUser = false;
    } else if (user.name) {
        filter.name = user.name;
        badUser = false;
    }

    if (badUser) {
        return;
    }

    let obj = {
        filter
    };

    let scheme = await jrfdb.getScheme('users');
    let res = await scheme.del(obj);
    if (!res.okay || !res.output.length) {
        return;
    }

    return res.output[0];

}

async function hardReset() {
    let scheme = await jrfdb.getScheme('users');
    let res = await scheme.del({filter: {}, originalMethod: true});
}

module.exports = {
    users,
    findUser,
    addUser,
    delUser,
    getUsers,
    hardReset
};