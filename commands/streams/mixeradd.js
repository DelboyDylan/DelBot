const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const Const = require('../../const.js');
const MixerSubscribe = require('../../mixersubscribe.js');
const GUtil = require('./util.js');

module.exports = class MixerAddCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'mixeradd',
            group: 'streams',
            memberName: 'mixeradd',
            description: 'Subscribes to a Mixer channel\'s go-live announcements',
            examples: ['mixeradd mixerChannel'],
            guildOnly: true,
            args: [
				{
					key: 'mixerChannel',
					prompt: 'Which Mixer channel do you want to receive go-live announcements for?',
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
        
        if (globalMixerSubs.indexOf(mixerChannelId) == -1){
            globalMixerSubs.push(mixerChannelId);

            await settings.set('global', 'mixersubs', globalMixerSubs)
                .catch(error => {
                    Util.updateLog('Failed to add global ' + mixerName + ' Mixer announcements!' + sourceInfo + '\n' +
                        error, 'error');

                    return message.reply('failed to add `' + mixerName +
                        '` Mixer channel to the stream announcements list! Please try again.')
                        .catch(error => {
                            Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error,
                                'error');
                        });
                });

            Util.saveJSON(
                {
                    online: mixerChannelData.online,
                    started: (mixerChannelData.online ? new Date() : null),
                    startFollowers: (mixerChannelData.online ? mixerChannelData.numFollowers : null),
                    startViews: (mixerChannelData.online ? mixerChannelData.viewersTotal : null),
                    offlined: (mixerChannelData.online ? null : mixerChannelData.updatedAt),
                    peakViewers: (mixerChannelData.online ? mixerChannelData.viewersCurrent : 0)
                },
                Const.streamDir + mixerChannelId);

            MixerSubscribe.mixerSubscribe(mixerChannelId, this.client);

            Util.updateLog('Added global ' + mixerName + ' Mixer announcements' + sourceInfo, 'alert');
        }

        if (mixerSubs.indexOf(mixerChannelId) == -1){
            mixerSubs.push(mixerChannelId);

            await message.guild.settings.set('mixersubs', mixerSubs)
                .catch(error => {
                    Util.updateLog('Failed to add local ' + mixerName + ' Mixer announcements!' + sourceInfo + '\n' +
                        error, 'error');

                    return message.reply('failed to add `' + mixerName +
                        '` Mixer channel to the stream announcements list! Please try again.')
                        .catch(error => {
                            Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error,
                                'error');
                        });
                });

            /* if (message.guild.id == Const.manorId){
                message.say('!cb mixer add ' + mixerName)
                    .then(() => {
                        Util.updateLog('Sent Manor CouchBot Mixer addition command');
                    })
                    .catch(error => {
                        Util.updateLog('Failed to send CouchBot Mixer addition command!' + sourceInfo + '\n' + error,
                            'error');
                    });
            } */

            Util.updateLog('Added local ' + mixerName + ' Mixer announcements' + sourceInfo);

            return message.reply('added `' + mixerName + '` Mixer channel to the stream announcements list')
                .catch(error => {
                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                });
        } else {
            return message.reply('`' + mixerName +
                '` Mixer channel has already been added to the stream announcements list!')
                .catch(error => {
                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                });
        }
    }
};