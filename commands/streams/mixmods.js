const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GUtil = require('./util.js');

module.exports = class MixModsCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'mixmods',
            aliases: ['mixermods'],
            group: 'streams',
            memberName: 'mixmods',
            description: 'Generates a list of moderators for a mixer channel',
            examples: ['mixmods mixerChannel'],
            args: [
                {
					key: 'mixerChannel',
					prompt: 'Which Mixer channel do you want the moderator list of?',
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

        const mixerChannelModNames = await GUtil.mixerChannelUserList(mixerChannelId, 'mod', message, sourceInfo);

        if (mixerChannelModNames == null) return;

        var dMessage = '```Markdown\n# ' + mixerChannelName + ' Mixer Channel Moderators\n';

        for (let i = 0; i < mixerChannelModNames.length; i++){
            dMessage += '* ' + mixerChannelModNames[i] + '\n';
        }

        if (mixerChannelModNames.length == 0){
            dMessage += 'No moderators found!';
        } else {
            dMessage += mixerChannelModNames.length + ' moderator' + Util.plu(mixerChannelModNames.length) + ' found!';
        }

        dMessage += '```';

        return message.say(dMessage)
            .then(() => {
                Util.updateLog('Mixer channel moderators posted' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('Mixer channel moderators failed to post!' + sourceInfo + '\n' + error, 'error');
            });
    }
};