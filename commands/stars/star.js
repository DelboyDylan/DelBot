const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GUtil = require('./util.js');

module.exports = class StarCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'star',
            group: 'stars',
            memberName: 'star',
            description: 'Quotes a message in the designated star channel',
            examples: ['star 367717156881956865'],
            guildOnly: true,
            args: [
				{
					key: 'message',
					prompt: 'What is the message ID of the post you wish to star?',
					type: 'message'
				}
			]
        });
    }

    hasPermission(message) {
        return message.channel.permissionsFor(message.member).has('MANAGE_MESSAGES');
    }

    run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        message.delete()
            .catch(error => {
                Util.updateLog('Failed to delete command!' + sourceInfo + '\n' + error, 'error');
            });

        GUtil.postStar(args.message, message.author, true, sourceInfo);
    }
};