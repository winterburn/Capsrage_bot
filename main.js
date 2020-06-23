var Discord = require('discord.js');
var config = require('./config.json');
var user_config = require('./user_configuration.json');


var bot = new Discord.Client();
bot.on('ready', () => {
    console.log('Connected');
    let channel = bot.channels.cache.find(ch => ch.name === 'General');
    channel.join();
})

bot.on('message', (message) => {
    if(!message.content.startsWith(config.prefix)) return;
    if(message.channel != 724741464604540959) return;
    let args = message.content.substring(1).split(' ');
    switch(args[0]) {
        case 'testi':
            console.log(user_config[message.member.id].song);
            let channel = message.guild.channels.cache.find(ch => ch.name === 'lanit');
            channel.send(user_config[message.member.id].song);
        break;
    }


})
bot.login(config.token);