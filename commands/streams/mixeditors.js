const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GUtil = require('./util.js');

module.exports = class MixEditorsCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'mixeditors',
            aliases: ['mixereditors'],
            group: 'streams',
            memberName: 'mixeditors',
            description: 'Generates a list of editors for a mixer channel',
            examples: ['mixeditors mixerChannel'],
            args: [
                {
					key: 'mixerChannel',
					prompt: 'Which Mixer channel do you want the editor list of?',
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

        const mixerChannelEditorNames =
            await GUtil.mixerChannelUserList(mixerChannelId, 'channeleditor', message, sourceInfo);

        if (mixerChannelEditorNames == null) return;

        var dMessage = '```Markdown\n# ' + mixerChannelName + ' Mixer Channel Editors\n';

        for (let i = 0; i < mixerChannelEditorNames.length; i++){
            dMessage += '* ' + mixerChannelEditorNames[i] + '\n';
        }

        if (mixerChannelEditorNames.length == 0){
            dMessage += 'No channel editors found!';
        } else {
            dMessage += mixerChannelEditorNames.length + ' channel editor' + Util.plu(mixerChannelEditorNames.length) +
                ' found!';
        }

        dMessage += '```';

        return message.say(dMessage)
            .then(() => {
                Util.updateLog('Mixer channel editors posted' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('Mixer channel editors failed to post!' + sourceInfo + '\n' + error, 'error');
            });
    }
};