const Util = require('./util.js');
const Const = require('./const.js');

const couchBotId = '308371905667137536';

exports.processManorMessage = function (message){
/*     if (message.author.id == couchBotId && message.embeds.length > 0){
        const manorStreamChannelId = message.guild.settings.get('streamchannel', '0');

        if (message.channel.id == manorStreamChannelId){
            const announcingStreams = message.guild.settings.get('announcestreams', false);

            if (announcingStreams && message.embeds[0].footer != null){
                if (message.embeds[0].footer.text.includes('Mixer')){
                    message.delete()
                        .then(() => {
                            Util.updateLog('Deleted manor CouchBot Mixer post');
                        })
                        .catch(error => {
                            Util.updateLog('Failed to delete manor CouchBot Mixer post!\n' + error, 'error');
                        });
                }
            }
            
            if (message.embeds[0].description != null){
                if (message.embeds[0].description.includes('list the streamers')){
                    message.delete()
                        .then(() => {
                            Util.updateLog('Deleted Manor CouchBot streamer command list');
                        })
                        .catch(error => {
                            Util.updateLog('Failed to delete Manor CouchBot streamer command list!\n' + error, 'error');
                        });
    
                    // sendCommand(message.channel, '!cb streamer list mixer');
                    sendCommand(message.channel, '!cb streamer list twitch');
                    sendCommand(message.channel, '!cb streamer list youtube');
                }
            }
        }

        if (message.embeds[0].description != null){
            if (message.embeds[0].description.includes('list your server configuration')){
                message.delete()
                    .then(() => {
                        Util.updateLog('Deleted Manor CouchBot config command list');
                    })
                    .catch(error => {
                        Util.updateLog('Failed to delete Manor CouchBot config command list!\n' + error, 'error');
                    });

                sendCommand(message.channel, '!cb config list allows');
                sendCommand(message.channel, '!cb config list channels');
                sendCommand(message.channel, '!cb config list messages');
                sendCommand(message.channel, '!cb config list misc');
            }
        }
    }

    function sendCommand(channel, command){
        channel.send(command)
            .then(sentMessage => {
                Util.updateLog('Sent Manor CouchBot command: ' + command);

                sentMessage.delete()
                    .catch(error => {
                        Util.updateLog('Failed to delete Manor CouchBot command!\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to send Manor CouchBot command!\n' + command + '\n' + error, 'error');
            });
    } */
};

exports.cleanupStreamAlerts = async function (client){
    const manorStreamChannelId = client.provider.get(Const.manorId, 'streamchannel', '0');

    if (!client.channels.has(manorStreamChannelId)) return;

    const manorStreamChannel = client.channels.get(manorStreamChannelId);

    const messages = await manorStreamChannel.fetchMessages({limit: 100})
        .catch(error => {
            Util.updateLog('Failed to fetch manor stream alert messages to delete!\n' + error, 'error');
        });

    if (typeof messages == 'undefined') return;

    var msg_array = messages.array();

    const timeNow = new Date().getTime();
    const numDays = manorStreamChannel.guild.settings.get('keepdays', 7);

    const startPoint = timeNow - (numDays * 24*60*60*1000);

    const safeMsgs = manorStreamChannel.guild.settings.get('safe', ['0']);

    msg_array = msg_array.filter(m => safeMsgs.indexOf(m.id) == -1 && m.createdAt.getTime() < startPoint);

    var delCount = 0;
    var failCount = 0;

    for (let i = 0; i < msg_array.length; i++){
        await msg_array[i].delete().then(() => { delCount++; }).catch(() => { failCount++; });
    }

    if (delCount > 0 || failCount > 0){
        Util.updateLog('Deleted ' + delCount + ' manor stream channel message' + Util.plu(delCount) +
            (failCount > 0 ? '. ' + failCount + ' failed!' : ''), 'inform');
    }
};

exports.cleanupAlerts = async function (client){
    const manorAlertsChannel = client.channels.get('376717656474124299');

    const messages = await manorAlertsChannel.fetchMessages({limit: 100})
        .catch(error => {
            Util.updateLog('Failed to fetch manor alert messages to delete!\n' + error, 'error');
        });

    if (typeof messages == 'undefined') return;

    var msg_array = messages.array();

    const timeNow = new Date().getTime();
    const numDays = 2;

    const startPoint = timeNow - (numDays * 24*60*60*1000);

    msg_array = msg_array.filter(m => m.createdAt.getTime() < startPoint);

    var delCount = 0;
    var failCount = 0;

    for (let i = 0; i < msg_array.length; i++){
        await msg_array[i].delete().then(() => { delCount++; }).catch(() => { failCount++; });
    }

    if (delCount > 0 || failCount > 0){
        Util.updateLog('Deleted ' + delCount + ' manor alert channel message' + Util.plu(delCount) +
            (failCount > 0 ? '. ' + failCount + ' failed!' : ''), 'inform');
    }
};