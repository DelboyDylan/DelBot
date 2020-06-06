const Commando = require('discord.js-commando');
const Sqlite = require('sqlite');
const Path = require('path');
const Util = require('./util.js');
const Const = require('./const.js');
const Manor = require('./manor.js');
const MixerSubscribe = require('./mixersubscribe.js');
const Star = require('./commands/stars/util.js');

Util.updateLog(Const.botName + ' initialising...');

const client = new Commando.Client({
    owner: '82144448300978176',
    unknownCommandResponse: false
});

client.setProvider(
    Sqlite.open(Path.join(__dirname, 'settings.sqlite3')).then(db => new Commando.SQLiteProvider(db))
);

client.on('groupRegister', group => {
    Util.updateLog('Group registered. ' + group.id + ' (' + group.name + ')');
});

client.on('commandRegister', command => {
    Util.updateLog('Command registered. ' + command.group.id + ':' + command.memberName);
});

client.registry
    .registerGroups([
        ['bot', 'Bot owner commands'],
        ['lolz', 'Comical commands'],
        ['mod', 'Moderator commands'],
        ['stars', 'Star message commands'],
        ['streams', 'Streamers and stream alerts commands']
    ])
    .registerDefaults()
    .registerCommandsIn(Path.join(__dirname, 'commands'));

client.on('ready', () => {
    Util.updateLog(Const.botName + ' coming online ...');

    client.user.setStatus('online')
        .catch(error => {
            Util.updateLog('Failed to set online bot status!\n' + error, 'error');
        });

    Util.setBotGame(client);

    Util.updateLog(Const.botName + ' online', 'go');

    Util.fetchAllMessages(client);

    const aMinute = 60 * 1000;
    const anHour = 60 * aMinute;

    setTimeout(MixerSubscribe.mixerAnnouncements, aMinute, client);
    setTimeout(MixerSubscribe.mixerSubscribes, aMinute, client);

    setTimeout(Manor.cleanupStreamAlerts, aMinute, client);
    setInterval(Manor.cleanupStreamAlerts, anHour, client);
    setTimeout(Manor.cleanupAlerts, aMinute, client);
    setInterval(Manor.cleanupAlerts, anHour, client);
});

client.on('message', message => {
    if (message.content == '(╯°□°）╯︵ ┻━┻'){
        const authorTag = message.author.tag;
        const msgLocation = Util.messageLocation(message);
        const sourceInfo = '\n' + authorTag + '\n' + msgLocation;

        message.channel.send('┬─┬﻿ ノ( ゜-゜ノ)')
            .then(() => {
                Util.updateLog('Table unflipped!' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('Table unflip failed!' + sourceInfo + '\n' + error, 'error');
            });
    }

    if (message.channel.type == 'text'){
        if (message.guild.id == Const.manorId){
            Manor.processManorMessage(message);
        }
    }
});

client.on('messageReactionAdd', (messageReaction, user) => {
    const theMessage = messageReaction.message;
    const theChannel = theMessage.channel;

    const sourceInfo = ' via Reaction\nSender: ' + user.tag + ' via ' + Util.messageLocation(theMessage);

    if (theChannel.type == 'text'){
        if (theChannel.permissionsFor(user).has('MANAGE_MESSAGES') && messageReaction.emoji.identifier == '%E2%AD%90'){
            Star.postStar(theMessage, user, true, sourceInfo);
        }
    }
});

client.on('guildCreate', guild => {
    Util.updateLog(Const.botName + ' joined a guild\n' + guild.name + ' (' + guild.id + ')');
});

client.on('guildDelete', guild => {
    Util.updateLog(Const.botName + ' left a guild\n'+ guild.name + ' (' + guild.id + ')');

    /* guild.settings.clear()
        .then(() => {
            Util.updateLog('Cleared guild settings\n' + guild.name + ' (' + guild.id + ')');
        })
        .catch(error => {
            Util.updateLog('Failed to clear guild settings!\n' + guild.name + ' (' + guild.id + ')\n' + error, 'error');
        }); */
});

client.on('error', error => {
    Util.updateLog(Const.botName + ' error\n' + error.message, 'error');
});

client.on('reconnecting', () => {
    Util.updateLog('Reconnecting to Discord ...', 'warn');
});

client.on('resume', replayed => {
    Util.updateLog('Resumed Discord connection\nReplayed ' + replayed + ' event' + Util.plu(replayed), 'go');
});

client.on('warn', info => {
    Util.updateLog(info, 'warn');
});

client.on('disconnect', event => {
    Util.updateLog('Disconnected from Discord!\n[' + event.code + '] - ' + event.reason, (event.wasClean ? 'warn' : 'error'));
});

client.on('commandRun', (command, promise, cMessage, args, fromPattern) => {
    const sourceInfo = Util.commandInfo(cMessage);

    if (command.groupID == 'commands' || command.groupID == 'util'){
        Util.updateLog('In-built command run' + sourceInfo);
    }
});

client.on('commandBlocked', (cMessage, reason) => {
    Util.updateLog('Command blocked. Reason: ' + reason + Util.commandInfo(cMessage), 'warn');
});

client.on('commandError', (command, error, cMessage) => {
    Util.updateLog('Command error! Command: ' + command.name + Util.commandInfo(cMessage) + '\n' + error,
        'error');
});

client.on('commandPrefixChange', (guild, prefix) => {
    const prefixGuild = (guild == null ? 'Global' : guild.name);
    const newPrefix = (prefix == null ? 'the default' : prefix);

    Util.updateLog(prefixGuild + ' command prefix changed to ' + newPrefix);
});

client.on('commandReregister', newCommand => {
    Util.updateLog('Command re-registered. ' + newCommand.group.id + ':' + newCommand.memberName);
});

client.on('commandUnregister', command => {
    Util.updateLog('Command un-registered. '  + command.group.id + ':' + command.memberName);
});

client.on('groupStatusChange', (guild, group, enabled) => {
    const groupGuild = (guild == null ? 'Global' : guild.name);
    const status = (enabled ? 'enabled' : 'disabled');

    Util.updateLog(groupGuild + ' "' + group.id + '" command group ' + status);
});

client.on('commandStatusChange', (guild, command, enabled) => {
    const commandGuild = (guild == null ? 'Global' : guild.name);
    const status = (enabled ? 'enabled' : 'disabled');

    Util.updateLog(commandGuild + ' "' + command.group.id + ':' + command.memberName + '" command ' + status);
});

Util.updateLog(Const.botName + ' logging in ...');

client.login('REDACTED')
    .catch(error => {
        Util.updateLog('Failed to login!\n' + error, 'error');
    });