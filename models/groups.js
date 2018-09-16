const jrfdb = require('jrfdb');

let groups = {
    name: 'groups',
    fields: {
        name: {
            description: 'Name',
            type: 'string',
            unique: true,
            min: 3,
            required: true
        },
        users: {
            description: 'Users',
            type: 'array',
            typeArray: 'dbref',
            scheme: 'users'
        }
    }
};

async function getGroups(groups, usersIdOnly = false) {

    if (!groups) {

        let find = {};

        let obj = {
            query: {
                find
            }
        };
        if (usersIdOnly) {
            obj.query.dbrefIdOnly = true;
        }

        let scheme = await jrfdb.getScheme('groups');
        let res = await scheme.get(obj);
        if (!res.okay || !res.output.length) {
            return;
        }

        return res.output;

    }

    if (groups && typeof groups === 'string') {

        let find = {
            $or: [
                {name: groups},
                {_id: groups}
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

        let scheme = await jrfdb.getScheme('groups');
        let res = await scheme.get(obj);
        if (!res.okay || !res.output.length) {
            return;
        }

        return res.output;

    }

    if (typeof groups === 'object' && Array.isArray(groups)) {

        let findGroups = [];

        for (let group of groups) {

            if (typeof group === 'string') {
                findGroups.push(group);
                continue;
            }

            if (typeof group === 'object' && group._id) {
                if (typeof group._id === 'string') {
                    findGroups.push(group._id);
                    continue;
                }
                findGroups.push(group._id.toString());
                continue;
            }

            if (typeof group === 'object' && group.name) {
                if (typeof group.name === 'string') {
                    findGroups.push(group.name);
                }
                continue;
            }

            if (typeof user === 'object') {
                findGroups.push(group.toString());
            }

        }

        if (!findGroups.length) {
            return;
        }

        let find = {
            $or: [
                {name: {$in: findGroups}},
                {_id: {$in: findGroups}}
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

        let scheme = await jrfdb.getScheme('groups');
        let res = await scheme.get(obj);
        if (!res.okay || !res.output.length) {
            return;
        }

        return res.output;

    }

    if (typeof groups === 'object') {

        let find = {};
        if (groups._id) {
            find._id = groups._id;
        } else if (groups.name) {
            find.name = groups.name;
        }

        let obj = {
            query: {
                find
            }
        };

        if (usersIdOnly) {
            obj.query.dbrefIdOnly = true;
        }

        let scheme = await jrfdb.getScheme('groups');
        let res = await scheme.get(obj);

        if (!res.okay || !res.output.length) {
            return;
        }

        return res.output;

    }

}

async function findGroup(group, usersIdOnly = false) {

    let find = {};
    let badGroup = true;
    if (group._id) {
        find._id = group._id;
        badGroup = false;
    } else if (group.name) {
        find.name = group.name;
        badGroup = false;
    }

    if (badGroup) {
        return;
    }

    let obj = {
        query: {
            find
        }
    };

    if (usersIdOnly) {
        obj.query.dbrefIdOnly = true;
    }

    let scheme = await jrfdb.getScheme('groups');
    let res = await scheme.get(obj);

    if (!res.okay || !res.output.length) {
        return;
    }

    return res.output[0];
}

async function addGroup(name, users) {

    let obj = {
        docs: {
            name
        }
    };

    if (users) {
        obj.docs.users = users;
    }

    let scheme = await jrfdb.getScheme('groups');
    let res = await scheme.add(obj);

    if (!res.okay || !res.output.length) {
        return;
    }

    return res.output[0];

}

async function delGroup(group) {

    let filter = {};
    let badGroup = true;
    if (group._id) {
        filter._id = group._id;
        badGroup = false;
    } else if (group.name) {
        filter.name = group.name;
        badGroup = false;
    }

    if (badGroup) {
        return;
    }

    let obj = {
        filter
    };

    let scheme = await jrfdb.getScheme('groups');
    let res = await scheme.del(obj);
    if (!res.okay || !res.output.length) {
        return;
    }

    return res.output[0];

}

async function addUsers(group, idUsers) {

    let scheme = await jrfdb.getScheme('groups');
    let obj = {
        query: {
            dbrefIdOnly: true
        }
    };

    if (group.name) {
        obj.query.find = {name: group.name};
    }

    if (group._id) {
        obj.query.find = {_id: group._id};
    }

    if (!obj.query.find) {
        return;
    }

    let res = await scheme.get(obj);
    if (!res.okay || !res.output.length) {
        return;
    }
    let foundGroup = res.output[0];
    if (!foundGroup) {
        return;
    }

    let groupUsers = [];
    if (foundGroup.users) {
        groupUsers = foundGroup.users;
    }

    if (!idUsers) {
        return;
    }

    if (!Array.isArray(idUsers)) {
        return;
    }

    let newUsers = [];
    for (let user of idUsers) {

        if (typeof user === 'string') {
            newUsers.push(user);
            continue;
        }

        if (typeof user === 'object' && user._id) {
            if (typeof user._id === 'string') {
                newUsers.push(user._id);
                continue;
            }
            newUsers.push(user._id.toString());
            continue;
        }

        if (typeof user === 'object') {
            newUsers.push(user.toString());
        }

    }

    for (let user of newUsers) {
        if (groupUsers.includes(user)) {
            continue;
        }
        groupUsers.push(user);
    }

    let objEdit = {
        docs: {
            filter: {
                _id: foundGroup._id
            },
            fields: {
                users: groupUsers
            }
        }
    };

    res = await scheme.edit(objEdit);
    if (!res.okay) {
        return;
    }

    obj.query.dbrefIdOnly = false;
    res = await scheme.get(obj);
    if (!res.okay || !res.output.length) {
        return;
    }

    let updateGroup = {
        group: res.output[0],
        users: []
    };

    for (let user of updateGroup.group.users) {
        if (newUsers.includes(user._id.toString())) {
            updateGroup.users.push(user);
        }
    }

    return updateGroup;

}

async function delUsers(group, idUsers) {

    let scheme = await jrfdb.getScheme('groups');
    let obj = {
        query: {
            dbrefIdOnly: false
        }
    };

    if (group.name) {
        obj.query.find = {name: group.name};
    }

    if (group._id) {
        obj.query.find = {_id: group._id};
    }

    if (!obj.query.find) {
        return;
    }

    let res = await scheme.get(obj);
    if (!res.okay || !res.output.length) {
        return;
    }
    let foundGroup = res.output[0];
    if (!foundGroup) {
        return;
    }

    let groupUsers = [];
    let usersBeforeEdit = [];
    if (foundGroup.users) {
        usersBeforeEdit = foundGroup.users;
        for (let user of foundGroup.users) {
            groupUsers.push(user._id.toString());
        }
    }

    let delUsers = [];
    for (let user of idUsers) {

        if (typeof user === 'string') {
            delUsers.push(user);
            continue;
        }

        if (typeof user === 'object' && user._id) {
            if (typeof user._id === 'string') {
                delUsers.push(user._id);
                continue;
            }
            delUsers.push(user._id.toString());
            continue;
        }

        if (typeof user === 'object') {
            delUsers.push(user.toString());
        }

    }

    for (let userId of delUsers) {

        let pos = groupUsers.indexOf(userId);
        while (pos > -1) {
            groupUsers.splice(pos, 1);
            pos = groupUsers.indexOf(userId);
        }

    }

    let objEdit = {
        docs: {
            filter: {
                _id: foundGroup._id
            },
            fields: {
                users: groupUsers
            }
        }
    };

    res = await scheme.edit(objEdit);
    if (!res.okay) {
        return;
    }

    obj.query.dbrefIdOnly = false;
    res = await scheme.get(obj);
    if (!res.okay || !res.output.length) {
        return;
    }

    let updateGroup = {
        group: res.output[0],
        users: []
    };

    for (let user of usersBeforeEdit) {
        if (delUsers.includes(user._id.toString())) {
            updateGroup.users.push(user);
        }
    }

    return updateGroup;

}

async function hardReset() {
    let scheme = await jrfdb.getScheme('groups');
    let res = await scheme.del({filter: {}, originalMethod: true});
}

module.exports = {
    groups,
    getGroups,
    findGroup,
    addGroup,
    delGroup,
    addUsers,
    delUsers,
    hardReset
};