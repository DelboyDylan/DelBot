const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GUtil = require('./util.js');

module.exports = class OtterCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'otter',
            group: 'lolz',
            memberName: 'otter',
            description: 'Laughing frenchingly!',
            examples: ['otter'],
            guildOnly: true,
            throttling: {
                usages: 3,
                duration: 1800
            }
        });
    }

    hasPermission(message) {
        return message.guild.members.has('150938001071931392'); // Le Otter#5401
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        const laughUrl = 'https://cdn.discordapp.com/attachments/229042454165323776/361885543707049984/giphy.gif';

        return message.say('', {embed: GUtil.picEmbed(laughUrl, message)})
            .then(() => {
                Util.updateLog('Laughs Frenchingly!' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('Scowls Frenchingly!' + sourceInfo + '\n' + error, 'error');
            });
    }
};