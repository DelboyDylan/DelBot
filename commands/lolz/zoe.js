const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GUtil = require('./util.js');

module.exports = class ZoeCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'zoe',
            group: 'lolz',
            memberName: 'zoe',
            description: 'Zoe\'s Cat Hats!',
            examples: ['zoe'],
            guildOnly: true,
            throttling: {
                usages: 3,
                duration: 1800
            }
        });
    }

    hasPermission(message) {
        return message.guild.members.has('180161631102173184'); // ZoeBell#1643
    }

    async run(message) {
        const sourceInfo = Util.commandInfo(message);

        const zoeBellName = message.guild.members.get('180161631102173184').displayName;
        const catHatTarget = await GUtil.randomRecentlyActiveMember(message.guild, sourceInfo);
        const catHatPicNum = Util.randomNumber(1, 28);
        const catHatPicUrl = 'http://www.somuchviral.com/wp-content/uploads/2015/02/cathead' + catHatPicNum + '.jpg';

        return message.say('*' + zoeBellName + ' placed a 🐱 on ' + catHatTarget +
            '\'s head (don\'t ask me why, I\'ve no idea)*', {embed: GUtil.picEmbed(catHatPicUrl, message)})
            .then(() => {
                Util.updateLog('Cat Hat!' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('No cat hat for you!' + sourceInfo + '\n' + error, 'error');
            });
    }
};