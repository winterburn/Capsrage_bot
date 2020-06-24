const Discord = require('discord.js');
const config = require('./config.json');
var user_config = require('./user_configuration.json');
const ytdl = require('ytdl-core');
const fs = require('fs');

class Capsrage {
    constructor() {
        this.queue = {
            voiceChannel: null,
            songs: [],
            volume: config.volume,
            connection: null,
            playing: false
        }
        this.bot = new Discord.Client();
        this.createEventHandlers();
        this.bot.login(config.token);
    }

    createEventHandlers = () => {
        this.bot.on('ready', () => {
            console.log('Connected');
        })
        this.bot.on('message', async (message) => {
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
                    this.save_user_config();
                    message.channel.send(`Entry song changed succesfully for <@${message.member.user.id}>`);
                break;
            }
        
        
        })
        this.bot.on('voiceStateUpdate', async (oldState, newState) => {
            if (newState.member.user.bot) return;
            if (oldState.channel === null && newState.channel !== null){
                    if (user_config[newState.member.user.id] === undefined) {
                        user_config[newState.member.user.id] = {'song': null};
                        this.save_user_config();
                        let channel = newState.member.guild.channels.cache.find(ch => ch.name === 'bot_commands');
                        if (!channel) console.log("no channel bot_commands found!!!")
                        channel.send(`You dont have song yet, <@${newState.member.user.id}>. You can change it with -change_song <youtube_link>`, {
                            allowedMentions: {
                                users: [newState.member.user.id]                    }
                        });
                        return;
                    }
                    if(!user_config[newState.member.user.id].song) return;
                    this.queue.voiceChannel = newState.channel;
                    let songInfo = await ytdl.getInfo(user_config[newState.member.user.id].song);
                    let song = {
                        title: songInfo.title,
                        url: songInfo.video_url
                    };
                    this.addSong(song, newState.channel);
            }
        })
    }

    addSong = async (song, channel) => {
        this.queue.songs.push(song);
        if (!this.queue.connection){
            try {
                this.queue.connection = await channel.join();
            }
            catch(err){
                console.log(err);
                this.queue.songs = [];
            }
        }
        if (!this.queue.playing){
            this.queue.playing = true;
            this.play(this.queue.songs[0]);
        }
    }

    play = (song) => {
        if(!song){
            this.queue.voiceChannel.leave();
            this.queue.voiceChannel = null;
            this.queue.playing = false;
            this.queue.connection = null;
            console.log('Queue finished');
            return;
        }
        console.log(`playing ${song.title}`);
        const dispatcher = this.queue.connection.play(ytdl(song.url, {filter: "audioonly"}));
        dispatcher.on("speaking", (speaking) => {
            if(!speaking){
                console.log("song finished!");
                this.queue.songs.shift();
                this.play(this.queue.songs[0]);
            }
        })
        dispatcher.on("error", console.error);
        dispatcher.setVolumeLogarithmic(this.queue.volume / 5);
    }

    save_user_config = () => {
        fs.writeFile('./user_configuration.json', JSON.stringify(user_config), (err) => {
            if(err){
                console.error(error);
            }
        })
    }
}

module.exports = {
    Capsrage: Capsrage
}