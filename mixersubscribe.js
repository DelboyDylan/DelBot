const Ws = require('ws');

var Carina = require('carina').Carina;
Carina.WebSocket = Ws;
Carina.defaultMaxListeners = 0;

const constellation = new Carina({ isBot: true }).open();

const Mixer = require('beam-client-node');
const mixer = new Mixer.Client(new Mixer.DefaultRequestRunner());

const Discord = require('discord.js');
const Util = require('./util.js');
const Const = require('./const.js');

var subbed = false;
var announced = false;

const mixerSubscribes = function (client){
    if (!subbed){
        const globalMixerSubs = client.provider.get('global', 'mixersubs', []);
        
        for (let i = 0; i < globalMixerSubs.length; i++){
            mixerSubscribe(globalMixerSubs[i], client);
        }

        subbed = true;
    }    
};

const mixerSubscribe = async function (mixerIdent, client){
    const res = await mixer.request('GET', 'channels/' + mixerIdent)
        .catch(error => {
            Util.updateLog('Failed to retreive Mixer data for channel ' + mixerIdent + '!\n' + error, 'error');
        });

    const mixerChannelData = res.body;

    if (!mixerChannelData.hasOwnProperty('error')){
        const trgId = 187269;
        const halfHour = 1800000;

        // Load API Data

        const mixerId = mixerChannelData.id;
        const mixerUserId = mixerChannelData.userId;        

        let mixerName = mixerChannelData.token;
        let mixerOnline = mixerChannelData.online;
        let mixerTitle = mixerChannelData.name;
        let mixerAudience = mixerChannelData.audience;
        let mixerTotalViews = mixerChannelData.viewersTotal;
        let mixerPeakViewers = mixerChannelData.viewersCurrent;
        let mixerFollowers = mixerChannelData.numFollowers;
        let mixerOfflineImg = mixerChannelData.bannerUrl;
        let mixerPartner = mixerChannelData.partnered;

        let mixerGameName = 'No game selected';
        let mixerGameCover = '';

        let mixerUserAvatar = mixerChannelData.user.avatarUrl;

        let mixerHosts = 0;
        let mixerHostViews = 0;
        let mixerHosters = [];

        let mixerNewSubs = 0;
        let mixerSharedResubs = 0;
        let mixerGiftSubs = 0;

        let mixerDirectPurchases = 0;

        if (mixerChannelData.type != null){
            mixerGameName = mixerChannelData.type.name;
            mixerGameCover = mixerChannelData.type.coverUrl;
        }

        if (mixerUserAvatar == null){
            mixerUserAvatar = Const.defaultMixerAvatar;
        }

        if (mixerOnline){
            Util.updateLog(mixerName + ' Mixer channel is online', 'alert');
        }

        // Load Stored Channel Data
        
        let mixerChannelFileData = Util.loadJSON(Const.streamDir + mixerId);
        let deleteTimer = null;

        let unknownTime = false;
        let unknownPeak = false;

        if (mixerOnline && mixerChannelFileData.started == null){
            mixerChannelFileData.started = new Date();
            mixerChannelFileData.startFollowers = mixerFollowers;
            mixerChannelFileData.startViews = mixerTotalViews;
        }

        if (mixerChannelFileData.online){
            if (!mixerOnline){
                mixerChannelFileData.offlined = mixerChannelData.updatedAt;
                unknownTime = true;
            }

            if (mixerChannelFileData.peakViewers > mixerPeakViewers){
                mixerPeakViewers = mixerChannelFileData.peakViewers;
            }

            await processGuildMessages(true);
        } else if (mixerOnline){
            unknownTime = true;
        }

        if (mixerChannelFileData.online || mixerOnline){
            unknownPeak = true;
        }

        if (mixerChannelFileData.offlined != null){
            let timeSinceOffline = new Date().getTime() - new Date(mixerChannelFileData.offlined).getTime();

            if (timeSinceOffline < halfHour){
                if (mixerChannelFileData.peakViewers > mixerPeakViewers){
                    mixerPeakViewers = mixerChannelFileData.peakViewers;
                }

                if (!mixerOnline){
                    deleteTimer = setTimeout(endSession, halfHour - timeSinceOffline);
                }
            } else {
                if (!mixerOnline){
                    endSession();
                }
            }
        }

        if (!mixerChannelFileData.online && mixerOnline){
            processGuildMessages(true);
        }
        
        mixerChannelFileData.online = mixerOnline;
        mixerChannelFileData.peakViewers = mixerPeakViewers;

        if (mixerChannelFileData.hasOwnProperty('hosts')){
            mixerHosts = mixerChannelFileData.hosts;
        }

        if (mixerChannelFileData.hasOwnProperty('hostViews')){
            mixerHostViews = mixerChannelFileData.hostViews;
        }

        if (mixerChannelFileData.hasOwnProperty('hosters')){
            mixerHosters = mixerChannelFileData.hosters;
        }

        mixerChannelFileData.hosts = mixerHosts;
        mixerChannelFileData.hostViews = mixerHostViews;
        mixerChannelFileData.hosters = mixerHosters;

        if (mixerChannelFileData.hasOwnProperty('subs')){
            mixerNewSubs = mixerChannelFileData.subs;
        }

        if (mixerChannelFileData.hasOwnProperty('sharedResubs')){
            mixerSharedResubs = mixerChannelFileData.sharedResubs;
        }

        if (mixerChannelFileData.hasOwnProperty('giftSubs')){
            mixerGiftSubs = mixerChannelFileData.giftSubs;
        }

        mixerChannelFileData.subs = mixerNewSubs;
        mixerChannelFileData.sharedResubs = mixerSharedResubs;
        mixerChannelFileData.giftSubs = mixerGiftSubs;

        if (mixerChannelFileData.hasOwnProperty('directPurchases')){
            mixerDirectPurchases = mixerChannelFileData.directPurchases;
        }

        mixerChannelFileData.directPurchases = mixerDirectPurchases;

        Util.saveJSON(mixerChannelFileData, Const.streamDir + mixerId);

        // Constellation Subscriptions

        // Channel Updates

        constellation.subscribe('channel:' + mixerId + ':update', data => {
            let updated = [];
            let triggerUpdate = false;

            if (data.hasOwnProperty('token')){
                mixerName = data.token;

                updated.push('username');
                triggerUpdate = true;
            }

            if (data.hasOwnProperty('online') && !data.hasOwnProperty('updatedAt')){
                mixerOnline = data.online;

                if (!mixerOnline){
                    if (deleteTimer == null){
                        mixerChannelFileData.offlined = new Date();
                        
                        deleteTimer = setTimeout(endSession, halfHour);
    
                        updated.push('offline');
                    }
                } else {
                    if (deleteTimer != null){
                        clearTimeout(deleteTimer);

                        deleteTimer = null;
                    }

                    if (mixerChannelFileData.started == null){
                        mixerChannelFileData.started = new Date();
                        mixerChannelFileData.startFollowers = mixerFollowers;
                        mixerChannelFileData.startViews = mixerTotalViews;
                    }

                    updated.push('online');
                    triggerUpdate = true;
                }

                mixerChannelFileData.online = mixerOnline;

                Util.saveJSON(mixerChannelFileData, Const.streamDir + mixerId);
            }

            if (data.hasOwnProperty('partnered')){
                mixerPartner = data.partnered;

                updated.push('partnered');
            }

            if (data.hasOwnProperty('name')){
                mixerTitle = data.name;

                updated.push('title');
                triggerUpdate = true;
            }

            if (data.hasOwnProperty('audience')){
                mixerAudience = data.audience;

                updated.push('audience');
                triggerUpdate = true;
            }

            if (data.hasOwnProperty('viewersTotal')){
                mixerTotalViews = data.viewersTotal;
            }

            if (data.hasOwnProperty('viewersCurrent')){
                let viewersCurrent = data.viewersCurrent;

                if (viewersCurrent > mixerPeakViewers && mixerOnline){
                    mixerPeakViewers = viewersCurrent;

                    mixerChannelFileData.peakViewers = mixerPeakViewers;

                    Util.saveJSON(mixerChannelFileData, Const.streamDir + mixerId);
                }
            }

            if (data.hasOwnProperty('numFollowers')){
                mixerFollowers = data.numFollowers;
            }

            if (data.hasOwnProperty('bannerUrl')){
                mixerOfflineImg = data.bannerUrl;

                updated.push('banner');
            }

            if (data.hasOwnProperty('type')){
                if (data.type != null){
                    mixerGameName = data.type.name;
                    mixerGameCover = data.type.coverUrl;
                } else {
                    mixerGameName = '';
                    mixerGameCover = '';
                }

                updated.push('game');
                triggerUpdate = true;
            }

            if (updated.length > 0){
                let logMode = '';

                if (updated.indexOf('online') > -1){
                    logMode = 'alert';
                }

                Util.updateLog('Received ' + mixerName + ' Mixer update (' + getUpdateList(updated) + ')', logMode);
            }
            

            if ((triggerUpdate && mixerOnline) ||
                (!mixerOnline && data.hasOwnProperty('online') && !data.hasOwnProperty('updatedAt'))){
                processGuildMessages(true);
            }
        })
        .then(() => {
            Util.updateLog('Subscribed to ' + mixerName + ' Mixer channel updates');
        })
        .catch(error => {
            Util.updateLog('Failed to subscribe to ' + mixerName + ' Mixer channel updates!\n' + error, 'error');
        });

        // User Updates
        
        constellation.subscribe('user:' + mixerUserId + ':update', data => {
            let updated = [];
            let triggerUpdate = false;

            if (data.hasOwnProperty('avatarUrl')){
                mixerUserAvatar = data.avatarUrl;

                if (mixerUserAvatar == null){
                    mixerUserAvatar = Const.defaultMixerAvatar;
                }

                updated.push('avatar');
                triggerUpdate = true;
            }

            if (updated.length > 0){
                Util.updateLog('Received ' + mixerName + ' Mixer update (' + getUpdateList(updated) + ')');
            }

            if (triggerUpdate && mixerOnline){
                processGuildMessages(true);
            }
        })
        .then(() => {
            Util.updateLog('Subscribed to ' + mixerName + ' Mixer user updates');
        })
        .catch(error => {
            Util.updateLog('Failed to subscribe to ' + mixerName + ' Mixer user updates!\n' + error, 'error');
        });

        // Channel Hosts

        constellation.subscribe('channel:' + mixerId + ':hosted', data => {
            let hoster = data.hoster.token;
            let hostViews = data.hoster.viewersCurrent;

            let duplicateHost = false;
            
            for (i = 0; i < mixerHosters.length; i++){
                if (hoster == mixerHosters[i]){
                    duplicateHost = true;
                }
            }

            if (!duplicateHost){
                mixerHosts++;
                mixerHostViews += hostViews;
                mixerHosters.push(hoster);

                mixerChannelFileData.hosts = mixerHosts;
                mixerChannelFileData.hostViews = mixerHostViews;
                mixerChannelFileData.hosters = mixerHosters;

                Util.saveJSON(mixerChannelFileData, Const.streamDir + mixerId);
            }
        })
        .then(() => {
            Util.updateLog('Subscribed to ' + mixerName + ' Mixer channel hosts');
        })
        .catch(error => {
            Util.updateLog('Failed to subscribe to ' + mixerName + ' Mixer channel hosts!\n' + error, 'error');
        });

        // Channel Subs

        constellation.subscribe('channel:' + mixerId + ':subscribed', data => {
            if (mixerOnline){
                mixerNewSubs++;

                mixerChannelFileData.subs = mixerNewSubs;

                Util.saveJSON(mixerChannelFileData, Const.streamDir + mixerId);
            }

            Util.updateLog('Received ' + mixerName + ' Mixer channel subscription: ' + data.user.username, 'inform');
        })
        .then(() => {
            Util.updateLog('Subscribed to ' + mixerName + ' Mixer channel subscriptions');
        })
        .catch(error => {
            Util.updateLog('Failed to subscribe to ' + mixerName + ' Mixer channel subscriptions!\n' + error, 'error');
        });

        // Channel Resubs

        constellation.subscribe('channel:' + mixerId + ':resubscribed', data => {
            Util.updateLog('Received ' + mixerName + ' Mixer channel re-subscription: ' + data.user.username, 'inform');
        })
        .then(() => {
            Util.updateLog('Subscribed to ' + mixerName + ' Mixer channel re-subscriptions');
        })
        .catch(error => {
            Util.updateLog('Failed to subscribe to ' + mixerName + ' Mixer channel re-subscriptions!\n' + error, 'error');
        });

        // Shared Channel Resubs

        constellation.subscribe('channel:' + mixerId + ':resubShared', data => {
            if (mixerOnline){
                mixerSharedResubs++;

                mixerChannelFileData.sharedResubs = mixerSharedResubs;

                Util.saveJSON(mixerChannelFileData, Const.streamDir + mixerId);
            }
            
            Util.updateLog('Received ' + mixerName + ' Mixer channel shared re-subscription: ' + data.user.username, 'inform');
        })
        .then(() => {
            Util.updateLog('Subscribed to ' + mixerName + ' Mixer channel shared re-subscriptions');
        })
        .catch(error => {
            Util.updateLog('Failed to subscribe to ' + mixerName + ' Mixer channel shared re-subscriptions!\n' + error, 'error');
        });

        // Gifted Channel Subs

        constellation.subscribe('channel:' + mixerId + ':subscriptionGifted', data => {
            if (mixerOnline){
                mixerGiftSubs++;

                mixerChannelFileData.giftSubs = mixerGiftSubs;

                Util.saveJSON(mixerChannelFileData, Const.streamDir + mixerId);
            }
            
            Util.updateLog('Received ' + mixerName + ' Mixer channel gift subscription: ' + data.gifterUsername + ' to ' + data.giftReceiverUsername, 'inform');
        })
        .then(() => {
            Util.updateLog('Subscribed to ' + mixerName + ' Mixer channel gift subscriptions');
        })
        .catch(error => {
            Util.updateLog('Failed to subscribe to ' + mixerName + ' Mixer channel gift subscriptions!\n' + error, 'error');
        });

        // Direct Purchases

        constellation.subscribe('channel:' + mixerId + ':directPurchased', data => {
            if (mixerOnline){
                mixerDirectPurchases++;

                mixerChannelFileData.directPurchases = mixerDirectPurchases;

                Util.saveJSON(mixerChannelFileData, Const.streamDir + mixerId);
            }

            Util.updateLog('Received ' + mixerName + ' Mixer channel direct purchase: ' + data.gameTitle, 'inform');
        })
        .then(() => {
            Util.updateLog('Subscribed to ' + mixerName + ' Mixer channel direct purchases');
        })
        .catch(error => {
            Util.updateLog('Failed to subscribe to ' + mixerName + ' Mixer channel direct purchases!\n' + error, 'error');
        });

        // Functions

        function endSession(){
            mixerPeakViewers = 0;
            mixerChannelFileData.peakViewers = mixerPeakViewers;

            mixerChannelFileData.started = null;

            mixerHosts = 0;
            mixerHostViews = 0;
            mixerHosters.length = 0;
            mixerChannelFileData.hosts = mixerHosts;
            mixerChannelFileData.hostViews = mixerHostViews;
            mixerChannelFileData.hosters = mixerHosters;

            mixerNewSubs = 0;
            mixerSharedResubs = 0;
            mixerGiftSubs = 0;
            mixerChannelFileData.subs = mixerNewSubs;
            mixerChannelFileData.sharedResubs = mixerSharedResubs;
            mixerChannelFileData.giftSubs = mixerGiftSubs;

            mixerDirectPurchases = 0;
            mixerChannelFileData.directPurchases = mixerDirectPurchases;
            
            unknownPeak = false;
            unknownTime = false;

            Util.saveJSON(mixerChannelFileData, Const.streamDir + mixerId);
            
            processGuildMessages(false);
        }

        async function processGuildMessages(postUpdate){
            const guilds = client.guilds.array();
            let numNew = 0;
            let numUpdate = 0;
            let numDelete = 0;
            let numSessionEnd = 0;

            for (let i = 0; i < guilds.length; i++){
                const announcingStreams = guilds[i].settings.get('announcestreams', false);

                const streamChannelId = guilds[i].settings.get('streamchannel', '0');
                const streamChannelSet = guilds[i].channels.has(streamChannelId);
                const streamchannel = guilds[i].channels.get(streamChannelId);

                const alertingStreams = guilds[i].settings.get('alertstreams', false);
                
                const streamAlertsRoleId = guilds[i].settings.get('streamalertsrole', '0');
                const streamAlertsRoleSet = guilds[i].roles.has(streamAlertsRoleId);

                const alertingHere = guilds[i].settings.get('alerthere', false);

                const deletingOffline = guilds[i].settings.get('deleteoffline', false);

                const mixerSubs = guilds[i].settings.get('mixersubs', []);
                const subscribed = mixerSubs.indexOf(mixerId) > -1;

                if (announcingStreams && streamChannelSet && subscribed){
                    const guildMsgFilename = Const.streamDir + guilds[i].id + '_' + mixerId;

                    let hasFile = Util.checkJSON(guildMsgFilename);
                    let guildMsgFileData;
                    let theMessage;

                    if (hasFile){
                        guildMsgFileData = Util.loadJSON(guildMsgFilename);

                        theMessage = await streamchannel.fetchMessage(guildMsgFileData.id)
                            .catch(() => {
                                Util.delJSON(guildMsgFilename);

                                hasFile = false;
                            });
                    }

                    if (postUpdate && !hasFile && mixerOnline){
                        guildMsgFileData = { id: null, customUserAvatar: null };

                        if (mixerId == trgId){
                            const trgThumbs = Util.loadJSON('..\\trgthumbs');
                            const trgThumbsIndex = Util.randomNumber(0, trgThumbs.length);

                            if (trgThumbsIndex < trgThumbs.length){
                                guildMsgFileData.customUserAvatar = trgThumbs[trgThumbsIndex];
                            }
                        }

                        theMessage = await streamchannel.send(genMixerMsg(),
                            {embed: genMixerEmbed(guildMsgFileData.customUserAvatar)})
                            .catch(error => {
                                Util.updateLog('Failed to send ' + mixerName + ' Mixer alert!\nLocation: ' +
                                    streamchannel.guild.name + ': #' + streamchannel.name + '\n' + error, 'error');
                            });

                        if (typeof theMessage != 'undefined'){
                            guildMsgFileData.id = theMessage.id;

                            Util.saveJSON(guildMsgFileData, guildMsgFilename);

                            numNew++;
                        }
                    } else if (postUpdate && hasFile){
                        await theMessage.edit(genMixerMsg(), {embed: genMixerEmbed(guildMsgFileData.customUserAvatar)})
                            .then(() => {
                                numUpdate++;
                            })
                            .catch(error => {
                                Util.updateLog('Failed to edit ' + mixerName + ' Mixer alert!\nLocation: ' +
                                    streamchannel.guild.name + ': #' + streamchannel.name + '\n' + error, 'error');
                            });
                    } else if (!postUpdate && hasFile){
                        if (deletingOffline){
                            await theMessage.delete()
                                .then(() => {
                                    numDelete++;
                                })
                                .catch(error => {
                                    Util.updateLog('Failed to delete ' + mixerName + ' Mixer alert!\nLocation: ' +
                                        streamchannel.guild.name + ': #' + streamchannel.name + '\n' + error, 'error');
                                });
                        }

                        Util.delJSON(guildMsgFilename);
                        numSessionEnd++;
                    }
                }

                function genMixerMsg(){
                    const mixerEmoji = '<:mixer:319945065336143873>';

                    let mixerMsg = '';

                    if (alertingStreams && mixerOnline){
                        if (alertingHere){
                            mixerMsg += '@here ';
                        } else if (streamAlertsRoleSet){
                            mixerMsg += '<@&' + streamAlertsRoleId + '> ';
                        }
                    }

                    mixerMsg += '**' + mixerName + '** is ';

                    if (mixerOnline){
                        mixerMsg += '[LIVE]';
                    } else {
                        mixerMsg += 'now offline. See you at the next stream 😃';
                    }

                    if (((alertingStreams && mixerOnline) && (streamAlertsRoleSet || alertingHere)) || !mixerOnline){
                        mixerMsg += '\n';
                    } else {
                        mixerMsg += ' ';
                    }

                    mixerMsg += mixerEmoji + ' <https://mixer.com/' + mixerName + '> ' + mixerEmoji;

                    return mixerMsg;
                }

                function genMixerEmbed(customUserAvatar){
                    let descWelcome = 'Come on over, and watch them streaming';
                    let descTitle = mixerTitle.trim();
                    let descUrl = 'https://mixer.com/' + mixerName;

                    if (!mixerOnline){
                        descWelcome = 'They were last streaming';

                        descWelcome += ((descWelcome.length + 1 + mixerGameName.length) > 47 ? '\n' : ' ');
                    } else if (mixerId == trgId){
                        descWelcome = 'Come check out the scrub lord streaming';
                    }                 

                    if (mixerOnline){
                        const mixerTitleWords = descTitle.split(' ');
                        let lineCharLimit = descWelcome.length;

                        if (mixerGameName.length > lineCharLimit){
                            lineCharLimit = mixerGameName.length;
                        }

                        if (descUrl.length > lineCharLimit){
                            lineCharLimit = descUrl.length;
                        }

                        descTitle = mixerTitleWords[0];

                        for (let j = 1; j < mixerTitleWords.length; j++){
                            if ((descTitle.length + 1 + mixerTitleWords[j].length) > lineCharLimit &&
                                !descTitle.includes('\n')){

                                descTitle += '\n' + mixerTitleWords[j];
                            } else {
                                descTitle += ' ' + mixerTitleWords[j];
                            }
                        }

                        descWelcome += '\n';
                        descTitle = '*' + descTitle + '*\n';
                    } else {
                        descTitle = '';
                    }

                    let descText = descWelcome + '`' + mixerGameName + '`\n' + descTitle + descUrl;

                    const cmdPrefix = Util.getCmdPrefix(client, guilds[i]);

                    /* if (mixerGameName == 'Other'){
                        mixerGameCover = 'http://i.imgur.com/0vO0lhB.png';
                    } else if (mixerGameName == 'Web Show'){
                        mixerGameCover = 'http://i.imgur.com/f64pVcd.png';
                    } else if (mixerGameName == 'Art' || mixerGameName == 'Drawing'){
                        mixerGameCover = 'http://i.imgur.com/Zig9iYn.jpg';
                    } else if (mixerGameName == 'Reading' || mixerGameName == 'Writing'){
                        mixerGameCover = 'http://i.imgur.com/fhTpyfR.jpg';
                    } else if (mixerGameName == 'Development'){
                        mixerGameCover = 'http://i.imgur.com/M1xdaHh.jpg';
                    } else if (mixerGameName == 'Cooking'){
                        mixerGameCover = 'http://i.imgur.com/tJ8wzXz.jpg';
                    } */
                    
                    if (mixerGameCover != null){
                        if (mixerGameCover.includes('default')){
                            mixerGameCover = '';
                        }
                    } else {
                        mixerGameCover = '';
                    }

                    let footerText = '[' + mixerAudience.charAt(0).toUpperCase() + mixerAudience.slice(1) + '] - ';
                    footerText += 'Do " ' + cmdPrefix + 'mixer ' + mixerName + ' " for more channel info';

                    let mixerEmbed = new Discord.RichEmbed()
                        .setColor(guilds[i].me.displayColor)
                        .setAuthor(client.user.username, client.user.displayAvatarURL)
                        .setThumbnail((customUserAvatar == null ? mixerUserAvatar : customUserAvatar))
                        .setTitle(mixerName + ' is ' + (mixerOnline ? 'live!' : 'offline'))
                        .setImage((mixerOnline ? mixerGameCover : mixerOfflineImg))
                        .setFooter(footerText, Const.mixerIconUrl);

                    if (!mixerOnline && !unknownTime){
                        const anHour = (halfHour * 2) / 1000;
                        const moleGuildId = '320349591285268490';

                        const totalMs = new Date(mixerChannelFileData.offlined).getTime() -
                            new Date(mixerChannelFileData.started).getTime();

                        const totalSecs = Math.floor(totalMs / 1000);

                        const sessHours = Math.floor(totalSecs / anHour);
                        const sessMins = Math.floor(totalSecs % anHour / 60);
                        const sessSecs = Math.floor(totalSecs % anHour % 60);
                        
                        const hours = sessHours > 0 ? sessHours + ' hr' + Util.plu(sessHours) + ' ' : '';
                        const minutes = sessMins > 0 ? sessMins + ' min' + Util.plu(sessMins) + ' ' : '';
                        const seconds = sessSecs > 0 ? sessSecs + ' sec' + Util.plu(sessSecs) : '';

                        const sessTime = hours + minutes + seconds;

                        const newFollowers = mixerFollowers - mixerChannelFileData.startFollowers;
                        const newViews = mixerTotalViews - mixerChannelFileData.startViews;

                        descText += '\n\n**__Session Stats__**';

                        /* const sessStats = '*Stream Time*: `' + sessTime + '`\n*Peak Viewers*: `' + (unknownPeak ? '≥': '') +
                            Util.formatNum(mixerPeakViewers) + '` *Follows*: `' + Util.formatNum(newFollowers) +
                            '` *Views*: `' + Util.formatNum(newViews) + '`'; */

                        mixerEmbed
                            .addField('Stream Time', sessTime, true)
                            .addField('Peak Viewers', (unknownPeak ? '≥': '') + Util.formatNum(mixerPeakViewers), true)
                            .addField('Follows', Util.formatNum(newFollowers), true)
                            .addField('Views', Util.formatNum(newViews), true)
                            .addField('Hosts', (unknownPeak ? '≥': '') + Util.formatNum(mixerHosts), true);
                            //.addField('Host Views', (unknownPeak ? '≥': '') + Util.formatNum(mixerHostViews), true);

                        if (mixerPartner && guilds[i].id != moleGuildId){
                            mixerEmbed
                                .addField('Subs', (unknownPeak ? '≥': '') + Util.formatNum(mixerNewSubs), true)
                                .addField('Shared Resubs', (unknownPeak ? '≥': '') + Util.formatNum(mixerSharedResubs), true)
                                .addField('Gifted Subs', (unknownPeak ? '≥': '') + Util.formatNum(mixerGiftSubs), true)
                                .addField('Direct Purchases', (unknownPeak ? '≥': '') + Util.formatNum(mixerDirectPurchases), true);
                        }
                    }

                    mixerEmbed.setDescription(descText);

                    return mixerEmbed;
                }
            }

            if (numNew > 0 || numUpdate > 0 || numDelete > 0){
                Util.updateLog(mixerName + ' Mixer channel announcements processed. [' +
                    (postUpdate ? numNew + ' New; ' + numUpdate + ' Update' + Util.plu(numUpdate) :
                    numDelete + ' deleted') + ']');
            }

            if (numSessionEnd > 0){
                Util.updateLog(numSessionEnd + ' ' + mixerName + ' Mixer stream guild session data file' +
                    Util.plu(numSessionEnd) + ' removed');
            }
        }

        function getUpdateList(updated){
            let updateList = '';

            for (i = 0; i < updated.length - 1; i++){
                updateList = updateList + updated[i] + ', ';
            }

            updateList = updateList + updated[updated.length - 1];

            return updateList;
        }
    } else {
        Util.updateLog(mixerIdent + ': ' + mixerChannelData.message, 'warn');
    }
};

const mixerUnsubscribe = function (mixerId, mixerName){
    // Channel Updates

    constellation.unsubscribe('channel:' + mixerId + ':update')
        .then(() => {
            Util.updateLog('Unsubscribed from ' + mixerName + ' Mixer channel updates');
        })
        .catch(error => {
            Util.updateLog('Failed to unsubscribe from ' + mixerName + ' Mixer channel updates!\n' + error, 'error');
        });

    // User Updates
    
    constellation.unsubscribe('user:' + mixerId + ':update')
        .then(() => {
            Util.updateLog('Unsubscribed from ' + mixerName + ' Mixer user updates');
        })
        .catch(error => {
            Util.updateLog('Failed to unsubscribe from ' + mixerName + ' Mixer user updates!\n' + error, 'error');
        });

    // Channel Hosts

    constellation.unsubscribe('channel:' + mixerId + ':hosted')
    .then(() => {
        Util.updateLog('Unsubscribed from ' + mixerName + ' Mixer channel hosts');
    })
    .catch(error => {
        Util.updateLog('Failed to unsubscribe from ' + mixerName + ' Mixer channel hosts!\n' + error, 'error');
    });

    // Channel Subs

    constellation.unsubscribe('channel:' + mixerId + ':subscribed')
    .then(() => {
        Util.updateLog('Unsubscribed from ' + mixerName + ' Mixer channel subscriptions');
    })
    .catch(error => {
        Util.updateLog('Failed to unsubscribe from ' + mixerName + ' Mixer channel subscriptions!\n' + error, 'error');
    });

    // Channel Resubs

    constellation.unsubscribe('channel:' + mixerId + ':resubscribed')
    .then(() => {
        Util.updateLog('Unsubscribed from ' + mixerName + ' Mixer channel re-subscriptions');
    })
    .catch(error => {
        Util.updateLog('Failed to unsubscribe from ' + mixerName + ' Mixer channel re-subscriptions!\n' + error, 'error');
    });

    // Shared Channel Resubs

    constellation.unsubscribe('channel:' + mixerId + ':resubShared')
    .then(() => {
        Util.updateLog('Unsubscribed from ' + mixerName + ' Mixer channel shared re-subscriptions');
    })
    .catch(error => {
        Util.updateLog('Failed to unsubscribe from ' + mixerName + ' Mixer channel shared re-subscriptions!\n' + error, 'error');
    });

    // Gifted Channel Subs

    constellation.unsubscribe('channel:' + mixerId + ':subscriptionGifted')
    .then(() => {
        Util.updateLog('Unsubscribed from ' + mixerName + ' Mixer channel gift subscriptions');
    })
    .catch(error => {
        Util.updateLog('Failed to unsubscribe from ' + mixerName + ' Mixer channel gift subscriptions!\n' + error, 'error');
    });

    // Direct Purchases

    constellation.unsubscribe('channel:' + mixerId + ':directPurchased')
    .then(() => {
        Util.updateLog('Unsubscribed from ' + mixerName + ' Mixer channel direct purchases');
    })
    .catch(error => {
        Util.updateLog('Failed to unsubscribe from ' + mixerName + ' Mixer channel direct purchases!\n' + error, 'error');
    });
}

const mixerAnnouncements = function (client){
    if (!announced){
        constellation.subscribe('announcement:announce', data => {
            const manorStreamChannelId = client.provider.get(Const.manorId, 'streamchannel', '0');
    
            if (!client.channels.has(manorStreamChannelId)) return;
    
            const manorStreamChannel = client.channels.get(manorStreamChannelId);
    
            const streamAlertsRoleId = manorStreamChannel.guild.settings.get('streamalertsrole', '0');
            const streamAlertsRoleSet = manorStreamChannel.guild.roles.has(streamAlertsRoleId);
    
            manorStreamChannel.send((streamAlertsRoleSet ? manorStreamChannel.guild.roles.get(streamAlertsRoleId) : '') +
                '```Markdown\n# Mixer Announcement!\n' + data.message + '```')
                .catch(error => {
                    Util.updateLog('Failed to send Mixer announcement!\n' + error, 'error');
                });
        })
        .then(() => {
            announced = true;
            Util.updateLog('Subscribed to Mixer announcements');
        })
        .catch(error => {
            Util.updateLog('Failed to subscribe to Mixer announcements!\n' + error, 'error');
        });
    }
};

constellation.on('error', error => {
    Util.updateLog('Constellation error\n' + error.message, 'error');
});

constellation.on('open', () => {
    console.log('Open!');
});

constellation.on('close', () => {
    console.log('Close!');
});

constellation.on('message', () => {
    console.log('Message!');
});

module.exports = {
    mixerSubscribes: mixerSubscribes,
    mixerSubscribe: mixerSubscribe,
    mixerUnsubscribe: mixerUnsubscribe,
    mixerAnnouncements: mixerAnnouncements
};