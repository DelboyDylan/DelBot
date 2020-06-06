const Commando = require('discord.js-commando');
const Discord = require('discord.js');
const Util = require('../../util.js');
const Const = require('../../const.js');
const GUtil = require('./util.js');

module.exports = class MixerCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'mixer',
            group: 'streams',
            memberName: 'mixer',
            description: 'Retrieves Mixer channel info',
            examples: ['mixer mixerChannel'],
            args: [
				{
					key: 'mixerChannel',
					prompt: 'Which Mixer channel do you want info for?',
					type: 'string',
                    validate: mixerChannel => {
                        if (!mixerChannel.includes(' ')) return true;

                        return 'A Mixer channel name cannot contain spaces';
                    }
				}
			]
        });
    }

    async run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        const mixerChannelData = await GUtil.getMixerChannelData(args.mixerChannel, message, sourceInfo);
        
        if (mixerChannelData == null) return;

        const timeNow = new Date();

        const mixerName = mixerChannelData.token;

        const mixerChannelId = mixerChannelData.id;
        const mixerOnline = mixerChannelData.online;
        const mixerPartner = mixerChannelData.partnered;
        const mixerTotalViews = mixerChannelData.viewersTotal;
        const mixerFollowers = mixerChannelData.numFollowers;
        const mixerJoined = new Date(mixerChannelData.createdAt);

        const mixerJoinedString = Util.dateUTC(mixerJoined);

        var mixerBeam = 'Mixer';

        if (mixerJoined.getTime() < 1495717200000){
            mixerBeam = 'Beam';
        }

        var mixerThumbnail = '';

        if (mixerChannelData.thumbnail != null){
            mixerThumbnail = mixerChannelData.thumbnail.url;
        }

        var mixerGameName = 'N/A';

        if (mixerChannelData.type != null){
            mixerGameName = mixerChannelData.type.name;
        }

        const mixerUserId = mixerChannelData.user.id;
        const mixerLevel = mixerChannelData.user.level;
        const mixerSparks = mixerChannelData.user.sparks;

        const twitter = mixerChannelData.user.social.twitter;
        const facebook = mixerChannelData.user.social.facebook;
        const youtube = mixerChannelData.user.social.youtube;
        const player = mixerChannelData.user.social.player;
        const discord = mixerChannelData.user.social.discord;
        const steam = mixerChannelData.user.social.steam;
        const instagram = mixerChannelData.user.social.instagram;
        const soundcloud = mixerChannelData.user.social.soundcloud;
        const spreadshirt = mixerChannelData.user.social.spreadshirt;
        const patreon = mixerChannelData.user.social.patreon;

        var mixerUserAvatarUrl = mixerChannelData.user.avatarUrl;

        if (mixerUserAvatarUrl == null){
            mixerUserAvatarUrl = Const.defaultMixerAvatar;
        }

        const mixerGroups = mixerChannelData.user.groups;

        const mixerViewerColor = [52, 160, 202];
        const mixerProColor = [198, 66, 234];
        const mixerGlobalModColor = [0, 153, 153];
        const mixerStaffColor = [236, 191, 55];
        const mixerFounderColor = [195, 45, 45];

        var mixerFounder = false;
        var mixerStaff = false;
        var mixerGlobalMod = false;
        var mixerPro = false;

        var mixerGroupColor = mixerViewerColor;
        var mixerGroupsArray = [];
        var mixerGroupsList = '';

        for (let i = 0; i < mixerGroups.length; i++){
            mixerGroupsArray.push(mixerGroups[i].name);

            if (mixerGroups[i].name == 'Founder'){
                mixerFounder = true;
            } else if (mixerGroups[i].name == 'Staff'){
                mixerStaff = true;
            } else if (mixerGroups[i].name == 'GlobalMod'){
                mixerGlobalMod = true;
            } else if (mixerGroups[i].name == 'Pro'){
                mixerPro = true;
            }
        }

        for (let i = 0; i < mixerGroupsArray.length - 1; i++){
            mixerGroupsList = mixerGroupsList + mixerGroupsArray[i] + ', ';
        }

        mixerGroupsList = mixerGroupsList + mixerGroupsArray[mixerGroupsArray.length - 1]

        if (mixerPro){
            mixerGroupColor = mixerProColor;
        }

        if (mixerGlobalMod){
            mixerGroupColor = mixerGlobalModColor;
        }

        if (mixerStaff){
            mixerGroupColor = mixerStaffColor;
        }

        if (mixerFounder){
            mixerGroupColor = mixerFounderColor;
        }

        const cmdPrefix = Util.getCmdPrefix(this.client, (message.channel.type == 'text' ? message.guild : null));

        const mixerEmbed = new Discord.RichEmbed()
            .setAuthor(this.client.user.username, this.client.user.displayAvatarURL)
            .setColor(mixerGroupColor)
            .setTitle('Mixer.com/' + mixerName)
            .setURL('https://mixer.com/' + mixerName)
            .setThumbnail(mixerUserAvatarUrl)
            .addField('Live', (mixerOnline ? 'Yep' : 'Nope'), true)
            .addField((mixerOnline ? 'Streaming' : 'Last Streamed'), mixerGameName, true)
            .addField('Followers', Util.formatNum(mixerFollowers), true)                        
            .addField('Total Views', Util.formatNum(mixerTotalViews), true)
            .addField('Partnered', (mixerPartner ? 'Yep' : 'Nope'), true)
            .addField('Groups', mixerGroupsList, true)
            .addField('Mixer Level', Util.formatNum(mixerLevel), true)
            .addField('Sparks', Util.formatNum(mixerSparks), true)
            .setImage(mixerThumbnail)
            .setFooter('Source: mixer.com - REST API', Const.mixerIconUrl)
            .setTimestamp(timeNow);

        if (twitter != null){
            mixerEmbed.addField('Twitter', twitter, true);
        }

        if (facebook != null){
            mixerEmbed.addField('Facebook', facebook, true);
        }

        if (youtube != null){
            mixerEmbed.addField('YouTube', youtube, true);
        }

        if (player != null){
            mixerEmbed.addField('Player.me', player, true);
        }

        if (discord != null){
            mixerEmbed.addField('Discord', discord, true);
        }

        if (steam != null){
            mixerEmbed.addField('Steam', steam, true);
        }

        if (instagram != null){
            mixerEmbed.addField('Instagram', instagram, true);
        }

        if (soundcloud != null){
            mixerEmbed.addField('SoundCloud', soundcloud, true);
        }

        if (spreadshirt != null){
            mixerEmbed.addField('SpreadShirt', spreadshirt, true);
        }

        if (patreon != null){
            mixerEmbed.addField('Patreon', patreon, true);
        }

        mixerEmbed
            .addField('Channel ID', mixerChannelId, true)
            .addField('User ID', mixerUserId, true)
            .addField('Channel Moderator List', 'Do `' + cmdPrefix + 'mixmods ' + mixerName + '`', true)
            .addField('Channel Editor List', 'Do `' + cmdPrefix + 'mixeditors ' + mixerName + '`', true)
            .addField('Joined ' + mixerBeam + ' (UTC)', mixerJoinedString, true);

        return message.say('', {embed: mixerEmbed})
            .then(() => {
                Util.updateLog('Posted ' + mixerName + ' Mixer info' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('Failed to post ' + mixerName + ' Mixer info!' + sourceInfo + '\n' + error, 'error');
            });
    }
};