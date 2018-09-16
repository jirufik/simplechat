const Koa = require('koa');
const JRFWS = require('../jrfws');
const app = new Koa();
const jrfws = new JRFWS();
// const testapp = require('./test');

const views = require('koa-views');
const json = require('koa-json');
const bodyparser = require('koa-bodyparser');

const index = require('./routes/index');

require('./models/index').initDB();

// middlewares
app.use(bodyparser({
    enableTypes: ['json', 'form', 'text']
}));
app.use(json());
app.use(require('koa-static')(__dirname + '/public'));

app.use(views(__dirname + '/views', {
    extension: 'html'
}));

// routes
app.use(index.routes(), index.allowedMethods());

// app.use(async ctx => {
//     ctx.body = 'Hello World';
// });

jrfws.attach(app);
jrfws.route('users', 'login', async (data, stop) => {
    await require('./routes/users').login(data, stop);
});
jrfws.route(async (data, stop) => {
    await require('./middleware').access(data, stop);
});
jrfws.route('users', 'add', async (data, stop) => {
    await require('./routes/users').add(data, stop);
});
jrfws.route('users', 'get', async (data, stop) => {
    await require('./routes/users').get(data, stop);
});
jrfws.route('users', 'del', async (data, stop) => {
    await require('./routes/users').del(data, stop);
});
jrfws.route('users', 'hardReset', async (data, stop) => {
    await require('./routes/users').hardReset(data, stop);
});
jrfws.route('groups', 'add', async (data, stop) => {
    await require('./routes/groups').add(data, stop);
});
jrfws.route('groups', 'del', async (data, stop) => {
    await require('./routes/groups').del(data, stop);
});
jrfws.route('groups', 'get', async (data, stop) => {
    await require('./routes/groups').get(data, stop);
});
jrfws.route('groups', 'hardReset', async (data, stop) => {
    await require('./routes/groups').hardReset(data, stop);
});
jrfws.route('groups.users', 'add', async (data, stop) => {
    await require('./routes/groups').addUsers(data, stop);
});
jrfws.route('groups.users', 'del', async (data, stop) => {
    await require('./routes/groups').delUsers(data, stop);
});
jrfws.route('messages', 'add', async (data, stop) => {
    await require('./routes/messages').add(data, stop);
});
jrfws.route('messages', 'get', async (data, stop) => {
    await require('./routes/messages').get(data, stop);
});
jrfws.route('messages', 'hardReset', async (data, stop) => {
    await require('./routes/messages').hardReset(data, stop);
});
jrfws.route('not found', async (data, stop) => {
    console.log('Not found');
});

app.listen(3002);

module.exports = {
    jrfws
};

