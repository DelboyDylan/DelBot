const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const Const = require('../../const.js');

module.exports = class ServersCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'servers',
            group: 'bot',
            memberName: 'servers',
            description: 'Lists Discord servers the bot is a member of',
            examples: ['servers']
        });
    }

    hasPermission(message) {
        return this.client.isOwner(message.author);
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);
        const allGuilds = this.client.guilds.array();

        message.delete()
            .catch(error => {
                Util.updateLog('Command deletion failed!' + sourceInfo + '\n' + error, 'error');
            });

        var serverList = '```Markdown\n# Bot Guilds List```';

        for (let i = 0; i < allGuilds.length; i++){
            serverList += '`' + allGuilds[i].name + ' (' + allGuilds[i].id +  ')`\n';
        }

        return message.say(serverList)
            .catch(error => {
                Util.updateLog('Failed to post Bot Guilds list!' + sourceInfo + '\n' + error, 'error');
            });
    }
};