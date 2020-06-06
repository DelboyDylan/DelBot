const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GUtil = require('./util.js');

module.exports = class NoCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'no',
            group: 'lolz',
            memberName: 'no',
            description: 'No!',
            examples: ['no'],
            guildOnly: true,
            throttling: {
                usages: 3,
                duration: 1800
            }
        });
    }

    hasPermission(message) {
        return message.guild.id == '229042454165323776'; // TRG Land
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        const laughUrl = 'https://cdn.discordapp.com/attachments/229042454165323776/590949170840600579/blobfish.png';

        return message.say('', {embed: GUtil.picEmbed(laughUrl, message)})
            .then(() => {
                Util.updateLog('No!' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('Yes!' + sourceInfo + '\n' + error, 'error');
            });
    }
};