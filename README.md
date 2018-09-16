# Simplechat

**Simplechat** is an example of using packages of [**jrfws**](https://github.com/jirufik/jrfws) (api websockets) and [**jrfdb**](https://github.com/jirufik/jrfdb) (odm mongodb). Mongodb, Koa, Vue, Vuetify,

![chat](chat.png)

## Install

* install mongodb
* install npm node
* $ git clone https://github.com/jirufik/simplechat.git
* $ npm i
* $ npm run start
* in browser http://localhost:3002/

## Settings

**Port**

```js
/// app.js
app.listen(3002);
```

```js
/// public/js/chat.js
await jrfws.connectToWs('ws://localhost:3002');
```

**MongoDB**

```js
/// app.js
/// initDB(port, namedb);
/// default port: 26000 namedb: jrfChatExample
require('./models/index').initDB();
```