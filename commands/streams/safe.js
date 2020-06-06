const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const Const = require('../../const.js');

module.exports = class SafeCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'safe',
            group: 'streams',
            memberName: 'safe',
            description: 'Sets the safe messages in the Manor stream channel',
            examples: ['safe 333951666082545664 333951667173326848 333951722294607876 333951722294607876'],
            guildOnly: true,
            args: [
				{
					key: 'cmdMsg',
					prompt: 'What is the message ID of the command message?',
					type: 'string'
                },
                {
					key: 'listMsgMixer',
					prompt: 'What is the message ID of the Mixer streamer list message?',
					type: 'string'
                },
                {
					key: 'listMsgTwitch',
					prompt: 'What is the message ID of the Twitch streamer list message?',
					type: 'string'
                },
                {
					key: 'listMsgYouTube',
					prompt: 'What is the message ID of the YouTube streamer list message?',
					type: 'string'
                }
			]
        });
    }

    hasPermission(message) {
        return this.client.isOwner(message.author) && message.guild.id == Const.manorId;
    }

    run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        message.guild.settings.set('safe', [args.cmdMsg, args.listMsgMixer, args.listMsgTwitch, args.listMsgYouTube])
            .then(() => {
                Util.updateLog('Manor safe stream channel messages set' + sourceInfo);

                return message.reply('Manor safe stream channel messages set')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to save setting!' + sourceInfo + '\n' + error, 'error');

                return message.reply('failed to set Manor safe stream channel messages! Please try again.')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            });
    }
};