const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class StreamChannelCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'streamchannel',
            group: 'streams',
            memberName: 'streamchannel',
            description: 'Sets the stream announcements channel',
            examples: ['streamchannel #channel', 'streamchannel channel'],
            guildOnly: true,
            args: [
				{
					key: 'channel',
					prompt: 'Which channel should stream announcements post in?',
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

        message.guild.settings.set('streamchannel', args.channel.id)
            .then(newStreamChannelId => {
                const channelName = message.guild.channels.get(newStreamChannelId).name;

                Util.updateLog('Stream channel set to "' + channelName + '"' + sourceInfo);

                return message.reply('stream channel set to `' + channelName + '`')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to save setting!' + sourceInfo + '\n' + error, 'error');

                return message.reply('failed to set stream channel! Please try again.')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            });
    }
};