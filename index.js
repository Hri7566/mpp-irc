require('dotenv').config();

Object.prototype.toString = function() {
    return JSON.stringify(this, undefined, 1).split('\n').join('');
}

const Client = require('mppclone-client');
const ircClient = require('node-irc');

const nick = 'mppclone';
const channel = '#mpp'

let cl = new Client('wss://mppclone.com:8443', process.env.MPPCLONE_TOKEN);
let irc = new ircClient('raspberrypi', 6697, nick, nick);
let prefix = '!';
let mpp_channel = '✧𝓓𝓔𝓥 𝓡𝓸𝓸𝓶✧';

cl.start();
cl.setChannel(mpp_channel);

cl.on('hi', msg => {
    console.log('Connected to MPP');
});

irc.connect();

irc.client.on('connect', () => {
    console.log('Connected to IRC');
});

const sendChat = str => {
    cl.sendArray([{
        m: 'a',
        message: `\u034f${str}`
    }]);
}

const ircChat = str => {
    irc.say(channel, str);
}

let ping = -1;

setInterval(() => {
    let ms = Date.now();
    cl.sendArray([{
        m: 't',
        e: ms
    }]);
}, 5000);

cl.on('t', msg => {
    ping = msg.t - msg.e - 0xa455;
});

irc.client.on('data', msg => {
    msg = msg.toString();

    // console.log(msg);

    let args = msg.split(' ');
    let type = args[1];
   
    if (msg.includes(`001 ${nick}`)) {
        irc.join(channel);
    }

    if (type == 'QUIT') {
        let n = args[0].substring(1, args[0].indexOf('!'))
        sendChat(`[IRC] ${n} left the chat room`);
    }

    if (type == 'JOIN') {
        let n = args[0].substring(1, args[0].indexOf('!'))
        sendChat(`[IRC] ${n} joined the chat room`);
    }

    if (type == 'PRIVMSG') {
        let n = args[0].substring(1, args[0].indexOf('!'))
        let str = msg.substring(args[0].length + args[1].length + args[2].length + '   '.length + ':'.length).split('\n').join(' ').split('\r').join(' ');
        
        if (nick == n) return;

        let isCommand = str.startsWith(prefix);

        if (isCommand) {
            msg = {
                a: str,
                p: {
                    name: n
                }
            }

            msg.args = msg.a.split(' ');
            msg.argcat = msg.a.substring(msg.args[0].length).trim();

            msg.cmd = msg.args[0].split(prefix).join('');

            switch (msg.cmd) {
                case 'ping':
                    ircChat(`Ping: ${ping}`);
                    break;
                case 'ppl':
                case 'users':
                    let users = "";
                    Object.values(cl.ppl).forEach(p => {
                        users += `[${p._id.substring(0, 6)}] ${p.name} | `;
                    });
                    users = users.substring(0, users.trim().length).trim();
                    ircChat(`Users: ${users}`);
                    break;
                case 'raw':
                    cl.sendArray([{
                        m: 'a',
                        message: msg.argcat
                    }]);
                    break;
                case 'who':
                    let p = Object.values(cl.ppl).find(p => p.name.toLowerCase().includes(msg.argcat.toLowerCase()) || p._id.toLowerCase().includes(msg.argcat.toLowerCase()) || p.id.toLowerCase().includes(msg.argcat.toLowerCase()));
                    if (p) {
                        let vals = "";
                        for (let k of Object.keys(p)) {
                            vals += `${k}: ${p[k]} | `;
                        }
                        vals = vals.substring(0, vals.trim().length - 2).trim();
                        ircChat(`Info for [${p._id.substring(0, 6)}] ${p.name}: ${vals}`);
                    } else {
                        ircChat('User not found.');
                    }
                    break;
				case 'rejoin':
					if (cl.isConnected()) {
						ircChat(`Attempting to rejoin MPP channel '${cl.desiredChannelId}'...`);
						cl.stop();
					} else {
						ircChat(`Not currently connected, rejoining MPP channel '${cl.desiredChannelId}'...`);
					}
					cl.start();
					break;
            }
        } else {
            sendChat(`[IRC] ${n}: ${str}`);
        }
    }
});

cl.on('a', msg => {
    if (irc.client.closed) return;
    if (msg.p._id == cl.getOwnParticipant()._id && msg.a.startsWith('\u034f[IRC]')) return;
    let tagText = "";
    if (msg.p.tag) {
        tagText = msg.p.tag.text;
    }
    ircChat(`[${msg.p._id.substring(0, 6)}] ${tagText == "" ? '' : `[${tagText}]`} ${msg.p.name}: ${msg.a}`);
});

cl.on('participant added', p => {
    if (irc.client.closed) return;
    let tagText = "";
    if (p.tag) {
        tagText = p.tag.text;
    }
    ircChat(`[${p._id.substring(0, 6)}] ${tagText == "" ? '' : `[${tagText}]`} ${p.name} joined the channel`);
});

cl.on('participant removed', p => {
    if (irc.client.closed) return;
    let tagText = "";
    if (p.tag) {
        tagText = p.tag.text;
    }
    ircChat(`[${p._id.substring(0, 6)}] ${tagText == "" ? '' : `[${tagText}]`} ${p.name} left the channel`);
});
