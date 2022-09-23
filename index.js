require('dotenv').config();

const Client = require('mppclone-client');
const ircClient = require('node-irc');

const nick = 'mppclone';
const channel = '#dev-room'

let cl = new Client('wss://mppclone.com:8443', process.env.MPPCLONE_TOKEN);
let irc = new ircClient('raspberrypi', 6697, nick, nick);

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

irc.client.on('data', msg => {
    msg = msg.toString();

    let args = msg.split(' ');
    let type = args[1];
   
    if (msg.includes(`001 ${nick}`)) {
        irc.join(channel);
    }

    if (type == 'PRIVMSG') {
        let n = args[0].substring(1, args[0].indexOf('!'))
        let str = msg.substring(args[0].length + args[1].length + args[2].length + '   '.length + ':'.length).split('\n').join(' ').split('\r').join(' ');
        
        if (nick == n) return;

        sendChat(`[IRC] ${n}: ${str}`);
    }
});

cl.on('a', msg => {
    if (irc.client.closed) return;
    if (msg.p._id == cl.getOwnParticipant()._id && msg.a.startsWith('\u034f[IRC]')) return;
    irc.say(channel, `[${msg.p._id.substring(0, 6)}] ${msg.p.name}: ${msg.a}`);
});

cl.on('participant added', p => {
    if (irc.client.closed) return;
    irc.say(channel, `[${p._id.substring(0, 6)}] ${p.name} joined the channel`);
});

cl.on('participant removed', p => {
    if (irc.client.closed) return;
    irc.say(channel, `[${p._id.substring(0, 6)}] ${p.name} left the channel`);
});
