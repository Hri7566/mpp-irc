require('dotenv').config();

const Client = require('mppclone-client');
const ircClient = require('node-irc');

let cl = new Client('wss://mppclone.com:8443', process.env.MPPCLONE_TOKEN);
