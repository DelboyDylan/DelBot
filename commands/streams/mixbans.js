const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GUtil = require('./util.js');

module.exports = class MixBansCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'mixbans',
            aliases: ['mixerbans'],
            group: 'streams',
            memberName: 'mixbans',
            description: 'Displays the number of banned users for a mixer channel',
            examples: ['mixbans mixerChannel'],
            args: [
                {
					key: 'mixerChannel',
					prompt: 'Which Mixer channel do you want the number of banned users of?',
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

        const mixerChannelName = mixerChannelData.token;
        const mixerChannelId = mixerChannelData.id;

        const mixerChannelBannedNames = await GUtil.mixerChannelUserList(mixerChannelId, 'banned', message, sourceInfo);

        if (mixerChannelBannedNames == null) return;

        var dMessage = '```Markdown\n# ' + mixerChannelName + ' Mixer Channel Bans\n';

        if (mixerChannelBannedNames.length == 0){
            dMessage += 'No banned users found!';
        } else {
            dMessage += Util.formatNum(mixerChannelBannedNames.length) + ' ban' + Util.plu(mixerChannelBannedNames.length) +
                ' found!';
        }

        dMessage += '```';

        return message.say(dMessage)
            .then(() => {
                Util.updateLog('Mixer channel bans posted' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('Mixer channel bans failed to post!' + sourceInfo + '\n' + error, 'error');
            });
    }
};