const Fs = require('fs');

const timeImprint = new Date().getTime();
const logFile = Fs.createWriteStream('logs\\log_' + timeImprint + '.txt');

const updateLog = function (logEntry, logMode){
    const formattedLogEntry = logEntry.replace(/\r?\n|\r/g, '\n                   ');

    var prefix = '';
    var suffix = '';

    if (logMode == 'alert'){
        prefix = '\x1b[35m';
    } else if (logMode == 'warn'){
        prefix = '\x1b[33m';
    } else if (logMode == 'error'){
        prefix = '\x1b[31m';
    } else if (logMode == 'go'){
        prefix = '\x1b[32m';
    } else if (logMode == 'inform'){
        prefix = '\x1b[36m';
    }

    if (prefix != ''){
        suffix = '\x1b[0m';
    }

    console.log(tStamp() + ': ' + prefix + formattedLogEntry + suffix);
    logFile.write(tStamp() + ': ' + formattedLogEntry + '\n');
};

function tStamp(theDate){
    if (typeof theDate == 'undefined'){
        theDate = new Date();
    }

    const timeSecs = new String('00' + theDate.getSeconds()).slice(-2);
    const timeMins = new String('00' + theDate.getMinutes()).slice(-2);
    const timeHrs = new String('00' + theDate.getHours()).slice(-2);
    const dateDay = new String('00' + theDate.getDate()).slice(-2);
    const dateMonth = new String('00' + (theDate.getMonth() + 1)).slice(-2);
    const dateYear = new String(theDate.getFullYear()).slice(-2);

    return dateDay + '/' + dateMonth + '/' + dateYear + ' ' + timeHrs + ':' + timeMins + ':' + timeSecs;
}

const dateUTC = function (theDate){
    const months = ['January','February','March','April','May','June','July','August','September','October','November',
        'December'];

    const timeSecs = new String('00' + theDate.getUTCSeconds()).slice(-2);
    const timeMins = new String('00' + theDate.getUTCMinutes()).slice(-2);
    const timeHrs = new String('00' + theDate.getUTCHours()).slice(-2);
    const dateDay = theDate.getUTCDate();
    const dateMonth = months[theDate.getUTCMonth()];
    const dateYear = theDate.getUTCFullYear();

    return dateMonth + ' ' + dateDay + ', ' + dateYear + ' ' + timeHrs + ':' + timeMins;
};

const plu = function (num){
    return (num == 1 ? '' : 's');
};

const formatNum = function (num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const commandInfo = function (message){
    return '\nCommand content: ' + message.content + '\nSender: ' + message.author.tag + ' via ' + messageLocation(message);
};

const messageLocation = function (message){
    return (message.channel.type == 'text' ? message.guild.name + ': #' + message.channel.name : 'Direct Message');
};

const setBotGame = function (client, botGame, sourceInfo){
    const botGames = [
        'with dark matter',
        'the guitar',
        'blackjack',
        'with zeros and ones',
        'with your ...',
        'beach volleyball',
        'with fire',
        'outside'
    ];

    if (typeof botGame == 'undefined' || botGame == ''){
        botGame = botGames[randomNumber(0, botGames.length - 1)];
    }

    client.user.setPresence({game: {name: botGame, type: 0}})
        .then(() => {
            if (typeof sourceInfo != 'undefined'){
                updateLog('Bot game reset' + sourceInfo);
            }
        })
        .catch(error => {
            updateLog('Failed to set bot game!' + (typeof sourceInfo == 'undefined' ? '' : sourceInfo) + '\n' + error,
                'error');
        });
};

const saveJSON = function (jsonObj, fileName){
    Fs.writeFileSync(fileName + '.json', JSON.stringify(jsonObj));
}

const loadJSON = function (fileName){
    return JSON.parse(Fs.readFileSync(fileName + '.json', 'utf8'));
}

const checkJSON = function (fileName){
    return Fs.existsSync(fileName + '.json');
}

const delJSON = function (fileName){
    if (checkJSON(fileName)){
        Fs.unlinkSync(fileName + '.json');
    }
}

const getCmdPrefix = function (client, guild){
    const botMention = '<@!' + client.user.id + '> ';
    let cmdPrefix = '!';

    if (guild != null){
        if (guild.commandPrefix != null){
            if (guild.commandPrefix != ''){
                cmdPrefix = guild.commandPrefix;
            } else {
                cmdPrefix = botMention;
            }
        } else {
            clientPrefix();
        }
    } else {
        clientPrefix();
    }

    return cmdPrefix;

    function clientPrefix(){
        if (client.commandPrefix != null){
            if (client.commandPrefix != ''){
                cmdPrefix = client.commandPrefix;
            } else {
                cmdPrefix = botMention;
            }
        }
    }
};

const fetchAllMessages = function (client){
    const channels = client.channels.array();

    for (let i = 0; i < channels.length; i++){
        if (channels[i].type == 'text'){
            if (channels[i].permissionsFor(channels[i].guild.me).has('VIEW_CHANNEL')){
                fetchMessages(channels[i]);
            }
        } else if (channels[i].type == 'dm' || channels[i].type == 'group'){
            fetchMessages(channels[i]);
        }
    }
};

const fetchMessages = function (channel){
    channel.fetchMessages({limit: 100})
        .catch(error => {
            updateLog('Failed to fetch messages!\n' + channel.guild.name + ': #' + channel.name + '\n' + error, 'error');
        });
};

const randomNumber = function (min, max){
    return Math.floor(Math.random() * (max - min + 1) + min);
};

module.exports = {
    logFile: logFile,
    updateLog: updateLog,
    dateUTC: dateUTC,
    plu: plu,
    formatNum: formatNum,
    commandInfo: commandInfo,
    messageLocation: messageLocation,
    setBotGame: setBotGame,
    saveJSON: saveJSON,
    loadJSON: loadJSON,
    checkJSON: checkJSON,
    delJSON: delJSON,
    getCmdPrefix: getCmdPrefix,
    fetchAllMessages: fetchAllMessages,
    randomNumber: randomNumber
};