const Discord = require('discord.js');
const Util = require('../../util.js');

exports.postStar = async function (starMessage, starredBy, confirm, sourceInfo){
    const starChannelId = starMessage.guild.settings.get('starchannel', '0');

    if (!starMessage.guild.channels.has(starChannelId)) return false;

    var star = {
        messageId: starMessage.id,
        channelId: starMessage.channel.id,
        quoteMsgId: null
    };

    if (starChannelId == star.channelId) return false;

    const starChannel = starMessage.guild.channels.get(starChannelId);
    const starsFilename = 'stars\\' + starMessage.guild.id;
    var guildStars = [];

    if (Util.checkJSON(starsFilename)){
        guildStars = Util.loadJSON(starsFilename);
    }

    var alreadyStarred = false;

    for (let i = 0; i < guildStars.length; i++){
        if (guildStars[i].messageId == star.messageId && guildStars[i].channelId == star.channelId){
            const currentStarMessage = await starChannel.fetchMessage(guildStars[i].quoteMsgId)
                .catch(error => {
                    Util.updateLog('Failed to fetch star message!' + sourceInfo + '\n' + error, 'error');
                });

            if (typeof currentStarMessage != 'undefined'){
                alreadyStarred = true;
            }
        }
    }

    if (alreadyStarred) return false;
    
    var avatarURL = starMessage.author.displayAvatarURL;
    var quoteAuthor = starMessage.author.tag;
    var roleColor = '#FFFFFF';

    const footerText = 'Sent in #' + starMessage.channel.name;
    const footerIconUrl = 'https://i.imgur.com/PlXZ1Yd.png';

    if (avatarURL.includes('avatars')){
        avatarURL = avatarURL.substr(0, avatarURL.lastIndexOf('.')) + '.webp';
    }

    if (starMessage.author.bot){
        quoteAuthor += ' [BOT]';
    }

    var guildMember = null;

    if (starMessage.guild.large){
        await starMessage.guild.fetchMembers()
            .catch(error => {
                Util.updateLog('Failed to fetch guild members!' + sourceInfo + '\n' + error, 'error');
            });

        if (starMessage.guild.members.has(starMessage.author.id)){
            guildMember = starMessage.guild.members.get(starMessage.author.id);
        }
    } else {
        guildMember = starMessage.member;
    }

    if (guildMember != null){
        roleColor = guildMember.displayColor;
        
        if (guildMember.nickname != null){
            quoteAuthor += ' (' + guildMember.nickname + ')';
        }
    }

    var starEmbed = new Discord.RichEmbed()
        .setAuthor(quoteAuthor, avatarURL)
        .setColor(roleColor)
        .setDescription(starMessage.content)
        .setFooter(footerText, footerIconUrl)
        .setTimestamp(starMessage.createdAt);

    var foundImage = false;

    if (starMessage.attachments.size > 0){
        const imgExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

        let attachedList = '';

        starMessage.attachments.forEach(attachment => {
            const attachmentExt = attachment.url.substr(attachment.url.lastIndexOf('.') + 1, attachment.url.length - 1)
                .toLowerCase();

            if (imgExts.indexOf(attachmentExt) > -1 && !foundImage){
                starEmbed.setImage(attachment.url);
                foundImage = true;
            } else {
                attachedList += attachment.url + '\n';
            }
        });

        if (attachedList != ''){
            starEmbed.addField('Attachments', attachedList);
        }
    }

    if (starMessage.embeds.length > 0){
        const firstEmbed = starMessage.embeds[0];

        if (firstEmbed.provider != null){
            const providerName = firstEmbed.provider.name;
            const details = (firstEmbed.author != null ? 'Author: `' + firstEmbed.author.name + '`\n' : '') +
                (firstEmbed.title != null ? 'Title: `' + firstEmbed.title + '`' : '');

            if (details != ''){
                starEmbed.addField(providerName + ' Details', details);
            }
        }
        
        if (firstEmbed.image != null && !foundImage){
            starEmbed.setImage(gifCheck(firstEmbed.image.url));
            foundImage = true;
        }
        
        if (firstEmbed.thumbnail != null && !foundImage){
            starEmbed.setImage(gifCheck(firstEmbed.thumbnail.url));
            foundImage = true;
        }

        function gifCheck(url){
            return url.replace('giphy_s.gif', 'giphy.gif');
        }
    }

    const quoteMessage = await starChannel.send('', {embed: starEmbed})
        .catch(error => {
            Util.updateLog('Failed to post star message quote!' + sourceInfo + '\n' + error, 'error');
        });

    if (typeof quoteMessage != 'undefined'){
        star.quoteMsgId = quoteMessage.id;

        guildStars.push(star);

        Util.saveJSON(guildStars, starsFilename);

        if (confirm){
            Util.updateLog('Message starred' + sourceInfo);

            starMessage.channel.send('<@' + starredBy.id +
                '> starred a message in this channel. See all the starred messages in <#' + starChannelId + '>.')
                .catch(error => {
                    Util.updateLog('Failed to confirm star!' + sourceInfo + '\n' + error, 'error');
                });
        }

        return true;
    } else {
        return false;
    }
}