require('dotenv').config();

const Client = require('mppclone-client');
const ircClient = require('node-irc');

const nick = 'mppclone';
const channel = '#dev-room'

let cl = new Client('wss://mppclone.com:8443', process.env.MPPCLONE_TOKEN);
let irc = new ircClient('raspberrypi', 6697, nick, nick);

let prefix = '!';

cl.start();
cl.setChannel('✧𝓓𝓔𝓥 𝓡𝓸𝓸𝓶✧')

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
    ping = msg.t - msg.e;
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
            msg.argcat = msg.a.substring(msg.args[0].length);

            msg.cmd = msg.args[0].split(prefix).join('');

            switch (msg.cmd) {
                case 'ping':
                    ircChat(`Ping: ${ping}`);
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
    ircChat(`[${msg.p._id.substring(0, 6)}] ${msg.p.name}: ${msg.a}`);
});

cl.on('participant added', p => {
    if (irc.client.closed) return;
    ircChat(`[${p._id.substring(0, 6)}] ${p.name} joined the channel`);
});

cl.on('participant removed', p => {
    if (irc.client.closed) return;
    ircChat(`[${p._id.substring(0, 6)}] ${p.name} left the channel`);
});
