const jrfdb = require('jrfdb');
const users = require('./users');
const groups = require('./groups');

let messages = {
    name: 'messages',
    fields: {
        date: {
            description: 'Date',
            type: 'date',
            required: true
        },
        mes: {
            description: 'Message',
            type: 'string',
            min: '1',
            required: true,
        },
        user: {
            description: 'User',
            type: 'dbref',
            scheme: 'users',
            required: true
        },
        toUser: {
            description: 'User',
            type: 'dbref',
            scheme: 'users'
        },
        toGroup: {
            description: 'Group',
            type: 'dbref',
            scheme: 'groups'
        },
        requiredOneOf: ['toUser', 'toGroup']
    }
};

async function add(mes) {

    let addMes = Object.assign({}, mes);

    if (!mes.user) {
        return;
    }

    let res = await users.getUsers(mes.user, true);
    if (!res || !res.length) {
        return;
    }
    addMes.user = res[0]._id;

    if (mes.toUser) {
        res = await users.getUsers(mes.toUser, true);
        if (!res || !res.length) {
            return;
        }
        addMes.toUser = res[0]._id;
    }

    if (mes.toGroup) {
        res = await groups.getGroups(mes.toGroup, true);
        if (!res || !res.length) {
            return;
        }
        addMes.toGroup = res[0]._id;
    }

    let scheme = await jrfdb.getScheme('messages');
    res = await scheme.add({docs: addMes});

    if (!res.okay || !res.output.length) {
        return;
    }

    return res.output;

}

async function get(query) {

    if (!query) {
        return;
    }

    if (typeof query !== "object") {
        return;
    }

    let find = {
        $and: []
    };

    if (query.group) {
        let res = await groups.getGroups(query.group, true);
        if (!res || !res.length) {
            return;
        }
        find.$and.push({'toGroup.$id': res[0]._id});
    }

    try {
        if (query.dateStart && query.dateEnd) {
            find.$and.push({
                $and: [
                    {date: {$gte: new Date(query.dateStart)}},
                    {date: {$lte: new Date(query.dateEnd)}}
                ]
            });
        } else if (query.dateStart) {
            find.$and.push({date: {$gte: new Date(query.dateStart)}});
        } else if (query.dateEnd) {
            find.$and.push({date: {$lte: new Date(query.dateEnd)}});
        }
    } catch (e) {
        return
    }

    if (query.user && query.toUser) {

        let res = await users.getUsers(query.user, true);
        if (!res || !res.length) {
            return;
        }
        let user = res[0]._id;

        res = await users.getUsers(query.toUser, true);
        if (!res || !res.length) {
            return;
        }
        let toUser = res[0]._id;

        find.$and.push({
            $or: [
                {$and: [{'user.$id': user}, {'toUser.$id': toUser}]},
                {$and: [{'user.$id': toUser}, {'toUser.$id': user}]}
            ]
        });

    }

    if (!find.$and.length) {
        return;
    }

    let obj = {query: {find}};
    if (query.count && typeof query.count === 'number') {
        obj.query.limit = query.count;
    }

    obj.query.sort = {date: -1};
    let scheme = await jrfdb.getScheme('messages');
    let res = await scheme.get(obj);

    if (!res.okay) {
        return;
    }

    if (res.output.length) {
        res.output.sort((a, b) => {
            if (a.date > b.date) {
                return 1;
            } else if (a.date < b.date) {
                return -1;
            }
            return 0;
        });
    }

    return res.output;
}

async function hardReset() {
    let scheme = await jrfdb.getScheme('messages');
    let res = await scheme.del({filter: {}, originalMethod: true});
}

module.exports = {
    messages,
    add,
    get,
    hardReset
};