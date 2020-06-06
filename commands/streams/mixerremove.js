const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const Const = require('../../const.js');
const MixerSubscribe = require('../../mixersubscribe.js');
const GUtil = require('./util.js');

module.exports = class MixerRemoveCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'mixerremove',
            group: 'streams',
            memberName: 'mixerremove',
            description: 'Unsubscribes from a Mixer channel\'s go-live announcements',
            examples: ['mixerremove mixerChannel'],
            guildOnly: true,
            args: [
				{
					key: 'mixerChannel',
					prompt: 'Which Mixer channel do you no longer want to receive go-live announcements for?',
					type: 'string',
                    validate: mixerChannel => {
                        if (!mixerChannel.includes(' ')) return true;

                        return 'A Mixer channel name cannot contain spaces';
                    }
				}
			]
        });
    }

    hasPermission(message) {
        return message.member.hasPermission('MANAGE_GUILD') || this.client.isOwner(message.author);
    }

    async run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        const mixerChannelData = await GUtil.getMixerChannelData(args.mixerChannel, message, sourceInfo);
        
        if (mixerChannelData == null) return;

        const mixerName = mixerChannelData.token;
        const mixerChannelId = mixerChannelData.id;

        const settings = this.client.provider;

        var globalMixerSubs = settings.get('global', 'mixersubs', []);
        var mixerSubs = message.guild.settings.get('mixersubs', []);

        if (mixerSubs.indexOf(mixerChannelId) > -1){
            mixerSubs.splice(mixerSubs.indexOf(mixerChannelId), 1);

            await message.guild.settings.set('mixersubs', mixerSubs)
                .catch(error => {
                    Util.updateLog('Failed to remove local ' + mixerName + ' Mixer announcements!' + sourceInfo + '\n' +
                        error, 'error');

                    return message.reply('failed to remove `' + mixerName +
                        '` Mixer channel from the stream announcements list! Please try again.')
                        .catch(error => {
                            Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error,
                                'error');
                        });
                });

            /* if (message.guild.id == Const.manorId){
                message.say('!cb mixer remove ' + mixerName)
                    .then(() => {
                        Util.updateLog('Sent Manor CouchBot Mixer removal command');
                    })
                    .catch(error => {
                        Util.updateLog('Failed to send CouchBot Mixer removal command!' + sourceInfo + '\n' + error,
                            'error');
                    });
            } */

            Util.updateLog('Removed local ' + mixerName + ' Mixer announcements' + sourceInfo);

            if (globalMixerSubs.indexOf(mixerChannelId) > -1){
                const guilds = this.client.guilds.array();

                var removeGlobal = true;

                for (let i = 0; i < guilds.length; i++){
                    let guildMixerSubs = guilds[i].settings.get('mixersubs', []);

                    if (guildMixerSubs.indexOf(mixerChannelId) > -1){
                        removeGlobal = false;
                    }
                }

                if (removeGlobal){
                    globalMixerSubs.splice(globalMixerSubs.indexOf(mixerChannelId), 1);

                    settings.set('global', 'mixersubs', globalMixerSubs)
                        .then(() =>{
                            Util.updateLog('Removed global ' + mixerName + ' Mixer announcements' + sourceInfo, 'alert');
                        })
                        .catch(error => {
                            Util.updateLog('Failed to remove global ' + mixerName + ' Mixer announcements!' +
                                sourceInfo + '\n' + error, 'error');
                        });

                    Util.delJSON(Const.streamDir + mixerChannelId);

                    MixerSubscribe.mixerUnsubscribe(mixerChannelId, mixerName);
                }
            }

            return message.reply('removed `' + mixerName + '` Mixer channel from the stream announcements list')
                .catch(error => {
                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                });
        } else {
            return message.reply('`' + mixerName + '` Mixer channel is not on the stream announcements list!')
                .catch(error => {
                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                });
        }
    }
};