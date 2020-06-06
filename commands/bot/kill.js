const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const Const = require('../../const.js');

module.exports = class KillCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'kill',
            group: 'bot',
            memberName: 'kill',
            description: 'Shuts the bot down',
            examples: ['kill']
        });
    }

    hasPermission(message) {
        return this.client.isOwner(message.author);
    }

    async run(message) {
        const sourceInfo = Util.commandInfo(message);

        if (message.channel.type == 'text'){
            await message.delete()
                .catch(error => {
                    Util.updateLog('Command deletion failed!' + sourceInfo + '\n' + error, 'error');
                });
        }
        
        await this.client.user.setStatus('invisible')
            .catch(error => {
                Util.updateLog('Failed to set offline bot status!' + sourceInfo + '\n' + error, 'error');
            });

        Util.updateLog(Const.botName + ' shutting down ...' + sourceInfo);

        Util.logFile.end();

        process.exit();
    }
};