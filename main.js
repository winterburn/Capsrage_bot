var Discord = require('discord.js');
var config = require('./config.json');
var user_config = require('./user_configuration.json');
var ytdl = require('ytdl-core');

const queue = {
    voiceChannel: null,
    songs: [],
    volume: config.volume,
    connection: null
}


var bot = new Discord.Client();
bot.on('ready', () => {
    console.log('Connected');
})

bot.on('message', async (message) => {
    if(!message.content.startsWith(config.prefix)) return;
    if(message.author.bot) return;
    if(message.channel != 724741464604540959) return;
    let args = message.content.substring(1).split(' ');
    switch(args[0]) {
        case 'testi':
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel){
                console.log(`User: ${message.member.user.username} not in voice channel`);
            }
            queue.voiceChannel = voiceChannel;
            let songInfo = await ytdl.getInfo(user_config[message.member.user.id].song);
            let song = {
                title: songInfo.title,
                url: songInfo.video_url
            };
            addSong(song, voiceChannel);
        break;
    }


})

bot.on('voiceStateUpdate', async (oldMember, newMember) => {
    let newUserChannel = newMember.channel;
    let oldUserChannel = oldMember.channel;
    console.log(newUserChannel);
    console.log(oldUserChannel);
    if (newMember.member.user.bot) return;
    if (oldUserChannel === null && newUserChannel !== null){
            if (user_config[newMember.member.user.id].song === undefined) return;
            queue.voiceChannel = newUserChannel;
            let songInfo = await ytdl.getInfo(user_config[newMember.member.user.id].song);
            let song = {
                title: songInfo.title,
                url: songInfo.video_url
            };
            addSong(song, newUserChannel);
    }
})

async function addSong(song, channel) {
    queue.songs.push(song);
    if (!queue.connection){
        try {
            queue.connection = await channel.join();
        }
        catch(err){
            console.log(err);
            queue.songs = [];
        }
    }
    play(queue.songs[0]);
}

function play(song) {
    if(!song){
        queue.voiceChannel.leave();
        queue.voiceChannel = null;
        return;
    }
    const dispatcher = queue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            queue.songs.shift();
            play(queue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(queue.volume / 5);
}
bot.login(config.token);