const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const Const = require('../../const.js');

module.exports = class KeepDaysCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'keepdays',
            group: 'streams',
            memberName: 'keepdays',
            description: 'Sets the number of days to keep messages in the Manor stream channel',
            examples: ['keepsdays 7'],
            guildOnly: true,
            args: [
				{
					key: 'numDays',
					prompt: 'How many days should Manor stream message be kept?',
					type: 'integer',
                    min: 1,
                    max: 30,
                    default: 7
                }
			]
        });
    }

    hasPermission(message) {
        return this.client.isOwner(message.author) && message.guild.id == Const.manorId;
    }

    run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        message.guild.settings.set('keepdays', args.numDays)
            .then(() => {
                Util.updateLog('Manor stream channel messages, days to keep set' + sourceInfo);

                return message.reply('Manor stream channel messages, days to keep set')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to save setting!' + sourceInfo + '\n' + error, 'error');

                return message.reply('failed to set Manor stream channel messages, days to keep! Please try again.')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            });
    }
};