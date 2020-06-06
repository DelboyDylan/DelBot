const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const Const = require('../../const.js');
const GUtil = require('./util.js');

module.exports = class StarPinsCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'starpins',
            group: 'stars',
            memberName: 'starpins',
            description: 'Converts the guilds pins into starred quotes',
            examples: ['starpins'],
            guildOnly: true
        });
    }

    hasPermission(message) {
        return message.member.hasPermission('MANAGE_GUILD') || this.client.isOwner(message.author);
    }

    async run(message) {
        const sourceInfo = Util.commandInfo(message);

        const starChannelId = message.guild.settings.get('starchannel', '0');
        
        if (!message.guild.channels.has(starChannelId)){
            return message.reply('stars are not enabled on this server!')
                .catch(error => {
                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                });
        }

        const channels = message.guild.channels.array();

        var allPinnedMessages = [];

        var standbyMsg = await message.reply('Starring pinned messages, please standby ...')
            .catch(error => {
                Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
            });

        for (let i = 0; i < channels.length; i++){
            if (channels[i].type == 'text' && channels[i].permissionsFor(message.guild.me).has('VIEW_CHANNEL')){
                const pinnedMessages = await channels[i].fetchPinnedMessages()
                    .catch(error => {
                        Util.updateLog('Failed to fetch pinned messages!' + sourceInfo + '\n' + error, 'error');
                    });

                if (typeof pinnedMessages != 'undefined'){
                    pinnedMessages.forEach(pinnedMessage => {
                        allPinnedMessages.push(pinnedMessage);
                    });
                }
            }
        }

        allPinnedMessages.sort(function(a, b) {
            return a.createdTimestamp - b.createdTimestamp;
        });

        var succeeded = 0;
        var failed = 0;

        for (let i = 0; i < allPinnedMessages.length; i++){
            const result = await GUtil.postStar(allPinnedMessages[i], message.author, false, sourceInfo);

            if (result){
                succeeded++;
            } else {
                failed++;
            }
        }

        standbyMsg.delete()
            .catch(error => {
                Util.updateLog('Failed to delete standby message!' + sourceInfo + '\n' + error, 'error');
            });

        Util.updateLog('Starred ' + succeeded + ' pinned message' + Util.plu(succeeded) +
            (failed > 0 ? '. ' + failed + ' failed!' : '') + sourceInfo);

        return message.reply('Starred ' + succeeded + ' pinned message' + Util.plu(succeeded) +
            (failed > 0 ? '. ' + failed + ' failed!' : '!'))
            .catch(error => {
                Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
            });
    }
};