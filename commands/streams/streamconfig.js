const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const Const = require('../../const.js');

module.exports = class StreamConfigCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'streamconfig',
            group: 'streams',
            memberName: 'streamconfig',
            description: 'Displays the stream announcements configuration details',
            examples: ['streamconfig'],
            guildOnly: true
        });
    }

    run(message, args) {
        const sourceInfo = Util.commandInfo(message);
        
        const announcingStreams = message.guild.settings.get('announcestreams', false);

        const streamChannelId = message.guild.settings.get('streamchannel', '0');
        const streamChannelSet = message.guild.channels.has(streamChannelId);

        const alertingStreams = message.guild.settings.get('alertstreams', false);
        
        const streamAlertsRoleId = message.guild.settings.get('streamalertsrole', '0');
        const streamAlertsRoleSet = message.guild.roles.has(streamAlertsRoleId);

        const alertingHere = message.guild.settings.get('alerthere', false);

        const deletingOffline = message.guild.settings.get('deleteoffline', false);

        var streamChannelName = 'Not Set';

        if (streamChannelSet){
            streamChannelName = message.guild.channels.get(streamChannelId).name;
        }

        var streamAlertsRoleName = 'Not Set';

        if (streamAlertsRoleSet){
            streamAlertsRoleName = message.guild.roles.get(streamAlertsRoleId).name;
        }

        var streamConfig = '```Markdown\n# ' + message.guild.name + ' Stream Announcements Config\n';

        streamConfig += '* Stream Announcements Enabled: ' + (announcingStreams ? 'True' : 'False') + '\n';       
        streamConfig += '* Announcements Channel: ' + (streamChannelSet ? '#' : '') + streamChannelName + '\n';
        streamConfig += '* Alerts Enabled: ' + (alertingStreams ? 'True' : 'False') + '\n';
        streamConfig += '* Alerts Role: ' + streamAlertsRoleName + '\n';
        streamConfig += '* Alerts Role @here Override: ' + (alertingHere ? 'True' : 'False') + '\n';
        streamConfig += '* Offline Deletions Enabled: ' + (deletingOffline ? 'True' : 'False') + '\n';

        if (message.guild.id == Const.manorId){
            const numDays = message.guild.settings.get('keepdays', 7);
            const safeMsgs = message.guild.settings.get('safe', ['0']);

            streamConfig += '- Days to Keep Messages: ' + numDays + '\n';
            streamConfig += '- Safe Messages: ' +
                (safeMsgs.length > 1 ? safeMsgs[0] + ', ' + safeMsgs[1] + ', ' + safeMsgs[2] + ', ' + safeMsgs[3] : 'Not Set')
                + '\n';
        }

        streamConfig += '```'

        return message.say(streamConfig)
            .catch(error => {
                Util.updateLog('Failed to send message!' + sourceInfo + '\n' + error, 'error');
            });
    }
};