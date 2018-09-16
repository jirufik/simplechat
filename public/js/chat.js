let chatUser = {_id: '', name: ''};
let users = [];
let groups = [];
let messages = [];
let box = {
    chatName: ''
};
let jrfws;

document.addEventListener('DOMContentLoaded', start());

async function start() {

    jrfws = new JRFWS();
    await routing();
    await jrfws.connectToWs('ws://localhost:3002');

}

async function routing() {

    await jrfws.route('users', 'login', async (data, stop) => {
        if (!data.data.okay || !data.data.user) {
            console.log('Invalid login');
            stop();
            return;
        }
        await setChatUser(data.data.user);
    });

    await jrfws.route('users', 'get', async (data, stop) => {
        if (!data.data.okay || !data.data.users) {
            console.log('Invalid get users');
            return;
        }
        await fillUsers(data.data.users);
    });

    await jrfws.route('users', 'add', async (data, stop) => {
        if (!data.data) {
            return;
        }
        await addUser(data.data);
    });

    await jrfws.route('groups', 'get', async (data, stop) => {
        if (!data.data.okay || !data.data.groups) {
            console.log('Invalid get groups');
            return;
        }
        await fillGroups(data.data.groups);
    });

    await jrfws.route('messages', 'get', async (data, stop) => {
        if (!data.data.okay || !data.data.mes) {
            console.log('Invalid get messages');
            return;
        }
        await fillMessages(data.data.mes);
    });

    await jrfws.route('messages', 'add', async (data, stop) => {
        if (!data.data.mes) {
            return;
        }
        await addMessage(data.data.mes);
    });
}

async function getUsers() {
    await jrfws.sendMes(null, 'users', 'get');
}

async function fillUsers(usersForFill) {
    users.splice(0);
    for (let user of usersForFill) {
        if (user._id === chatUser._id) {
            continue;
        }
        user.active = false;
        user.noread = 0;
        user.showBadge = false;
        users.push(user);
    }
}

async function addUser(user) {

    if (!user._id && !user.name) {
        return;
    }

    user.active = false;
    user.noread = 0;
    user.showBadge = true;
    users.push(user);

}

async function getGroups() {
    await jrfws.sendMes(null, 'groups', 'get');
}

async function fillGroups(groupsForFill) {
    groups.splice(0);
    for (let group of groupsForFill) {
        group.active = false;
        group.noread = 0;
        group.showBadge = false;
        groups.push(group);
    }
    if (box.chatName === '') {
        await activateAllUsers();
    }
}

async function activateAllUsers() {

    for (let group of groups) {
        if (group.name === 'All users') {
            await activateChat(group);
            break;
        }
    }

}

async function activateChat(chat) {

    for (let group of groups) {
        group.active = false;
    }

    for (let user of users) {
        user.active = false;
    }

    chat.active = true;
    chat.showBadge = false;
    chat.noRead = 0;
    box.chatName = chat.name;

    await getMessages(chat);

}

async function getActiveChat() {

    for (let group of groups) {
        if (group.active) {
            return group;
        }
    }

    for (let user of users) {
        if (user.active) {
            return user;
        }
    }

}

async function getMessages(chat, count = 20) {

    let query = {
        user: chatUser._id,
        count
    };

    if (chat.users) {
        query.group = chat._id;
    } else {
        query.toUser = chat._id;
    }

    messages.splice(0);
    await jrfws.sendMes({query}, 'messages', 'get');

}

async function fillMessages(mess) {

    messages.splice(0);
    for (let mes of mess) {
        mes.date = new Date(mes.date).toLocaleString();
        messages.push(mes);
    }

}

async function addMessage(mess) {

    if (!Array.isArray(mess)) {
        return;
    }

    let chat = await getActiveChat();

    for (let mes of mess) {

        if (mes.toGroup) {

            if (mes.toGroup._id === chat._id) {
                mes.date = new Date(mes.date).toLocaleString();
                messages.push(mes);
                continue;
            }

            for (let group of groups) {
                if (group._id === mes.toGroup._id) {
                    group.showBadge = true;
                    group.noread++;
                    break;
                }
            }

        } else {

            if (mes.toUser._id === chat._id || chat._id === mes.user._id) {
                mes.date = new Date(mes.date).toLocaleString();
                messages.push(mes);
                continue;
            }

            for (let user of users) {

                if (user._id === mes.user._id) {
                    user.showBadge = true;
                    user.noread++;
                    break;
                }
            }

        }

    }

}


async function sendMessage(mes) {

    if (!mes) {
        return;
    }

    if (typeof mes !== 'string') {
        return;
    }

    let chat = await getActiveChat();
    if (!chat) {
        return;
    }

    let objMes = {
        date: new Date(),
        mes,
        user: chatUser,
    };

    if (chat.users) {
        objMes.toGroup = chat;
    } else {
        objMes.toUser = chat;
    }

    await jrfws.sendMes({mes: objMes}, 'messages', 'add');

}

async function setChatUser(user) {
    chatUser._id = user._id;
    chatUser.name = user.name;
    await getGroups();
    await getUsers();
}

async function exitChat() {

    chatUser._id = '';
    chatUser.name = '';
    users.slice(0);
    groups.slice(0);
    messages.slice(0);
    box.chatName = '';

}

async function delObjectsChat(nameObj) {

    await jrfws.sendMes(null, nameObj, 'hardReset');

}

Vue.component('main-view', {
    data: function () {
        return {
            groups,
            drawer: false,
            left: true,
            bottomNav: 'recent',
            sheet: false,
            users,
            messages,
            message: '',
            rows: 1,
            rowHeight: 24,
            height: 24,
            box,
            dialog: false
        }
    },
    mounted() {
        this.$nextTick(this.scrollToLast);
    },
    methods: {
        activateChat,
        exit() {
            exitChat();
        },
        showSheet() {
            this.sheet = true;
            this.$refs.form.reset();
        },
        sendMessage() {
            if (!this.message) {
                return;
            }
            let mes = this.message;
            sendMessage(mes);
            this.message = '';
            this.sheet = false;
            // this.$nextTick(this.scrollToLast);
        },
        scrollToLast() {
            if (!messages.length) {
                return;
            }
            let sel = `#card${messages[messages.length - 1]._id}`;
            this.$vuetify.goTo(sel, {
                duration: 300,
                offset: 0,
                easing: 'easeInOutCubic',
            });
        },
        openDialog() {
            this.dialog = true;
        },
        classUser(chat) {
            if (chat.active) {
                return 'blue--text';
            }
            return 'black--text';
        },
        classIcon(chat) {
            if (chat.active) {
                return 'blue lighten-1 white--text';
            }
            return 'grey lighten-1 white--text';
        },
        classCardTitle(user) {
            if (user._id !== chatUser._id) {
                return 'blue--text';
            }
            return 'orange--text';
        },
        delMessages() {
            delObjectsChat('messages');
        },
        delGroups() {
            delObjectsChat('groups');
        },
        delUsers() {
            delObjectsChat('users');
        }
    },
    computed: {
        visibleAddMes() {
            return !this.sheet;
        }
    },
    watch: {
        messages: function (val) {
            this.$nextTick(this.scrollToLast);
        }
    },
    template: `
<v-app>
<v-toolbar
                color="orange"
                fixed
                clipped-right
                app
        >
            <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
            <v-icon class="mx-3">fa-youtube</v-icon>
            <v-toolbar-title class="mr-5 align-center">
                <span class="title">{{box.chatName}}</span>
            </v-toolbar-title>

        </v-toolbar>

        <v-navigation-drawer
                fixed
                v-model="drawer"
                app
        >

            <v-list>
                <v-list-tile @click="exit">
                    <v-list-tile-avatar>
                        <v-icon class="orange lighten-1 white--text">exit_to_app</v-icon>
                    </v-list-tile-avatar>
                    <v-list-tile-content>
                        <v-list-tile-title>EXIT</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-divider></v-divider>
                
                <v-list-tile @click="openDialog">
                    <v-list-tile-avatar>
                        <v-icon class="grey lighten-1 white--text">settings</v-icon>
                    </v-list-tile-avatar>
                    <v-list-tile-content>
                        <v-list-tile-title>Settings</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>

                <v-divider></v-divider>
                <v-list-tile
                        v-for="group in groups"
                        :key="group._id"
                        @click="activateChat(group)"
                >

                    <v-list-tile-avatar>
                        <v-icon :class="classIcon(group)">group</v-icon>
                    </v-list-tile-avatar>
                    <v-list-tile-content>
                        <v-list-tile-title :class="classUser(group)">{{group.name}}</v-list-tile-title>
                    </v-list-tile-content>

                    <v-list-tile-action>
                        <v-badge
                                v-model="group.showBadge"
                                color="orange"
                                left
                        >
                            <span slot="badge">{{ group.noread }}</span>
                        </v-badge>
                    </v-list-tile-action>

                </v-list-tile>
                
                <v-divider></v-divider>
                
                <v-list-tile
                        v-for="user in users"
                        :key="user._id"
                        @click="activateChat(user)"
                >

                    <v-list-tile-avatar>
                        <v-icon :class="classIcon(user)">face</v-icon>
                    </v-list-tile-avatar>
                    <v-list-tile-content>
                        <v-list-tile-title :class="classUser(user)">{{user.name}}</v-list-tile-title>
                    </v-list-tile-content>

                    <v-list-tile-action>
                        <v-badge
                                v-model="user.showBadge"
                                color="orange"
                                left
                        >
                            <span slot="badge">{{ user.noread }}</span>
                        </v-badge>
                    </v-list-tile-action>

                </v-list-tile>
                
            </v-list>

        </v-navigation-drawer>

        <v-content>
            <v-container fluid grid-list-lg>
                <v-layout wrap justify-center>
                    <v-flex xs12>

                        <v-layout wrap>

                            <v-flex xs12
                                    v-for="mes in messages"
                                    :key="mes._id">
                                <v-card :id="'card' + mes._id" color="blue-grey darken-2" class="white--text">
                                    <v-card-title :class=classCardTitle(mes.user)>
                                        <div>
                                            <div class="headline">{{ mes.user.name }}</div>
                                            <!--<div> {{mes.mes}} </div>-->
                                        </div>
                                    </v-card-title>
                                    <v-card-text>{{ mes.mes }}</v-card-text>
                                    <v-card-actions class="pa-3">
                                        <v-spacer></v-spacer>
                                        <div class="grey--text"> {{ mes.date }}</div>
                                    </v-card-actions>
                                </v-card>

                            </v-flex>

                        </v-layout>

                    </v-flex>

                </v-layout>
                
                <v-layout>
                    <v-flex>
                        <v-dialog
                            v-model="dialog"
                            max-width="290"
                          >
                            
                          <v-card class="mt-0 pt-0">
                            <v-card-title class="orange darken-1">
                                <h4 style="color:white">Settings</h4>
                            </v-card-title>
                            <v-card-text>
                            <v-flex>
                                <div>
                                <v-btn  @click="delMessages" depressed color="error">Delete messages</v-btn>
                                </div>
                                <div>
                                <v-btn @click="delUsers" depressed color="error">Delete users</v-btn>
                                </div>
                                <div></div>
                                <div>
                                <v-btn @click="delGroups" depressed color="error">Delete groups</v-btn>
                                </div>
                            </v-flex>    
                            </v-card-text>
                          </v-card>
                            
                        </v-dialog>
                    </v-flex>
                </v-layout>

                <v-layout wrap class="white">
                    <v-flex xs12>
                        <v-bottom-sheet max-width=600 inset v-model="sheet">

                            <v-card>
                                <v-form ref="form">
                                    <v-textarea
                                            background-color="white"
                                            color="orange"
                                            autofocus
                                            box
                                            rows=1
                                            label="message"
                                            auto-grow
                                            append-outer-icon="send"
                                            v-model="message"
                                            @click:append-outer="sendMessage"
                                            @keyup.ctrl.enter="sendMessage"
                                    ></v-textarea>
                                </v-form>

                            </v-card>

                        </v-bottom-sheet>
                    </v-flex>
                </v-layout>

            </v-container>
        </v-content>

        <v-fab-transition>
            <v-btn
                    v-show="visibleAddMes"
                    color="orange"
                    dark
                    bottom
                    right
                    fixed
                    fab
                    @click="showSheet"
            >
                <v-icon>send</v-icon>
            </v-btn>
        </v-fab-transition>

</v-app>`
});

Vue.component('login-view', {
    data() {
        return {
            chatUser,
            name: ''
        }
    },
    methods: {
        async inlogin() {
            await jrfws.sendMes({user: {name: this.name}}, 'users', 'login');
        }
    },
    template: `<v-app>

        <v-container fill-height justify-center align-center >
            <!-- <v-layout row > -->
            <v-flex xs12 sm5 md4 lg3>
                <v-card class="mt-0 pt-0">
                    <v-card-title class="orange darken-1">
                        <h4 style="color:white">Simple chat</h4>
                    </v-card-title>
                    <v-card-text>
                        <form @submit.prevent="inlogin">
                            <v-layout row wrap>
                                <v-flex xs12 md4 >
                                    <v-subheader>Name</v-subheader>
                                </v-flex>
                                <v-flex  xs12 md8>
                                    <v-text-field class="input-group--focused" name="name" v-model="name" label="name" value="Input text"
                                    color="orange"></v-text-field>
                                </v-flex>
                            </v-layout>
                            <v-btn type="submit">Start chat</v-btn>
                        </form>
                    </v-card-text>
                </v-card>
            </v-flex>
            <!-- </v-layout> -->
        </v-container>

    </v-app>`
});

let app = new Vue({
    data: {
        chatUser
    },
    el: '#app'
});