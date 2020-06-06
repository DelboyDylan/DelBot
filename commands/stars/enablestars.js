const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class EnableStarsCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'enablestars',
            group: 'stars',
            memberName: 'enablestars',
            description: 'Sets the stars channel',
            examples: ['enablestars #channel', 'enablestars channel'],
            guildOnly: true,
            args: [
				{
					key: 'channel',
					prompt: 'Which channel should starred messages post in?',
					type: 'channel'
				}
			]
        });
    }

    hasPermission(message) {
        return message.member.hasPermission('MANAGE_GUILD') || this.client.isOwner(message.author);
    }

    run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        message.guild.settings.set('starchannel', args.channel.id)
            .then(newStarChannelId => {
                const channelName = message.guild.channels.get(newStarChannelId).name;

                Util.updateLog('Star channel set to "' + channelName + '"' + sourceInfo);

                return message.reply('star channel set to `' + channelName + '`')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to save setting!' + sourceInfo + '\n' + error, 'error');

                return message.reply('failed to set star channel! Please try again.')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            });
    }
};