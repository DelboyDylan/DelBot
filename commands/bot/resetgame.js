const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class KillCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'resetgame',
            group: 'bot',
            memberName: 'resetgame',
            description: 'Resets the bot game',
            examples: ['resetgame', 'resetgame gameName'],
            args: [
                {
					key: 'botGame',
					prompt: 'What would you like to set the bot game to?',
					type: 'string',
                    default: ''
				}
			]
        });
    }

    hasPermission(message) {
        return this.client.isOwner(message.author);
    }

    run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        Util.setBotGame(this.client, args.botGame, sourceInfo);

        if (message.channel.type == 'text'){
            message.delete()
                .catch(error => {
                    Util.updateLog('Command deletion failed!' + sourceInfo + '\n' + error, 'error');
                });
        }
    }
};