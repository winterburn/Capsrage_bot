var Discord = require('discord.js');
var config = require('./config.json');
var user_config = require('./user_configuration.json');
var ytdl = require('ytdl-core');

const queue = {
    voiceChannel: null,
    songs: [],
    volume: 5,
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
            let songInfo = await ytdl.getInfo(user_config[message.member.user.id].song);
            console.log(songInfo)
            let song = {
                title: songInfo.title,
                url: songInfo.video_url
            };
            console.log(song)
            addSong(song, voiceChannel);
        break;
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
        return;
    }
    console.log(song)
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