const Discord = require('discord.js');
const Util = require('../../util.js');

exports.picEmbed = function (picUrl, message){
    const embeddedPic = new Discord.RichEmbed()
        .setColor((message.channel.type == 'text' ? message.member.displayColor : '#FFFFFF'))
        .setImage(picUrl);

    return embeddedPic;
};

exports.randomRecentlyActiveMember = async function (guild, sourceInfo){
    if (guild.large){
        await guild.fetchMembers()
            .catch(error => {
                Util.updateLog('Failed to fetch guild members!' + sourceInfo + '\n' + error, 'error');
            });
    }

    var recentlyActive = [];

    guild.members.forEach(member => {
        if (member.lastMessage != null){
            const aDay = 86400000;
            const timeSinceLastMessage = new Date().getTime() - member.lastMessage.createdTimestamp;

            if (timeSinceLastMessage <= aDay){
                recentlyActive.push(member.displayName);
            }
        }
    });

    return recentlyActive[Util.randomNumber(0, recentlyActive.length - 1)];
};