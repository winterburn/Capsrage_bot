const Discord = require('discord.js');
const config = require('./config.json');
var user_config = require('./user_configuration.json');
const ytdl = require('ytdl-core');
const fs = require('fs');

const queue = {
    voiceChannel: null,
    songs: [],
    volume: config.volume,
    connection: null,
    playing: false
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
        case 'change_song':
            if (!user_config[message.member.user.id]) user_config[message.member.user.id] = {'song': args[1]};
            else {
                user_config[message.member.user.id].song = args[1];
            }
            fs.writeFile('./user_configuration.json', JSON.stringify(user_config), (err) => {
                if(err){
                    console.error(error);
                }
            })
            message.channel.send(`Entry song changed succesfully for <@${message.member.user.id}>`);
        break;
    }


})

bot.on('voiceStateUpdate', async (oldState, newState) => {
    let newUserChannel = newState.channel;
    let oldUserChannel = oldState.channel;
    console.log(newUserChannel);
    console.log(oldUserChannel);
    if (newState.member.user.bot) return;
    if (oldUserChannel === null && newUserChannel !== null){
            if (user_config[newState.member.user.id] === undefined) {
                let channel = newState.member.guild.channels.cache.find(ch => ch.name === 'bot_commands');
                if (!channel) console.log("no channel bot_commands found!!!")
                channel.send(`You dont have song yet, <@${newState.member.user.id}>. You can change it with -change_song <youtube_link>`, {
                    allowedMentions: {
                        users: [newState.member.user.id]                    }
                });
                return;
            }
            queue.voiceChannel = newUserChannel;
            let songInfo = await ytdl.getInfo(user_config[newState.member.user.id].song);
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
    if (!queue.playing){
        play(queue.songs[0]);
    }
}

function play(song) {
    queue.playing = true;
    if(!song){
        queue.voiceChannel.leave();
        queue.voiceChannel = null;
        queue.playing = false;
        return;
    }
    const dispatcher = queue.connection.play(ytdl(song.url));
    dispatcher.on("speaking", (speaking) => {
        if(!speaking){
            console.log("song finished!");
            queue.songs.shift();
            play(queue.songs[0]);
        }
    })
    dispatcher.on("error", console.error);
    dispatcher.setVolumeLogarithmic(queue.volume / 5);
}
bot.login(config.token);