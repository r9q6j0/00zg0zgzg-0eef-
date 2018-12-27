// Toutes les constances sont ici
const Discord = require("discord.js");
const fs = require("fs");
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const prefix = "f!"
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const youtube = new YouTube("AIzaSyAlP12UFtynoOijWpkp688IUP0P1PWnFqA");
const queue = new Map();

// On charge les commandes ICI
fs.readdir("./commandes/", (err, files) => {

    if(err) console.log(err);
    let jsfile = files.filter(f => f.split(".").pop() === "js");
    if(jsfile.length <= 0){
      console.log("Impossible de trouver les commandes");
      return;
    }
  
    jsfile.forEach((f, i) =>{
      let props = require(`./commandes/${f}`);
      console.log(`${f} chargé !`);
      bot.commands.set(props.help.name, props);
    });
  });

bot.on('ready', () => { 
    bot.user.setActivity("manger des frites | Créé par Certurix")
    console.log("▬▬▬▬▬▬▬▬▬▬▬▬\n BOT EN LIGNE \n▬▬▬▬▬▬▬▬▬▬▬▬")
})


bot.on('guildMemberAdd', member => {
const channel = bot.channels.find('id', '525378385816584233')
const channelmsg = `:arrow_right: ${member} viens de rejoindre la communauté, bienvenue à lui.`
if(!channel) return; // Si on ne trouve pas le channel, on ne fait rien.

const mpmsg = `Bienvenue ${member}, installe toi bien parmis nous, vas lire le règlement pour éviter d'enfreindre  l'une des règles. Si tu souhaite avoir de l'aide sur un addon de Frite, va dans le salon <#509340358983811097>.`

bot.guilds.get("525377074584879110").channels.get("525378385816584233").send(channelmsg)
bot.users.get(member.id).send(mpmsg)
});

bot.on('guildMemberRemove', member => {
    const channel = bot.channels.find('id', '525378385816584233')
    const channelmsg = `<:RedArrow:525382568263155749> ${member} viens de quitter la communauté, bonne continuation à lui.`
    if(!channel) return; // Si on ne trouve pas le channel, on ne fait rien.
    
    bot.guilds.get("525377074584879110").channels.get("525378385816584233").send(channelmsg)
    });

bot.on('error', err => {
    console.log(err)
    const error = new Discord.RichEmbed()
    .setTitle("Erreur")
    .setDescription(err)
    .setTimestamp()
    bot.channels.find('id', '525378404204150795').send(error)
})

bot.on('message', message => {
    let messageArray = message.content.split(" ");
    let cmd = messageArray[0];
    let args = messageArray.slice(1);
  
    let commandfile = bot.commands.get(cmd.slice(prefix.length));
    if(commandfile) commandfile.run(bot,message,args);
})

bot.on('messageDelete', r => {
    const channel = bot.channels.find('id', '525378404204150795')
    if(!channel) return bot.users.find('id', '525378769360519168').send("Il semblerait qu'il y ait un problème avec le salon de logs. Apparement, il a été supprimé.")
    const messageDeleteembed = new Discord.RichEmbed()
    .setDescription("Message supprimé")
    .setColor('RANDOM')
    .addField("Message", r)
    .addField("Auteur", r.author)

})

bot.on('message', msg => {
    if(msg.content.includes("<@310045978923368448>")) {
        const user = msg.author
        return msg.channel.send(user+", merci de bien vouloir contacter le <@&517789010299715604> pour toutes demandes et d'éviter à l'avenir de mentionner ``@Frite``.")
    }
})

bot.on('message', async message => {
    var servers = {};
    var args = message.content.substring(prefix.length).split(" ");
    if (!message.content.startsWith(prefix)) return;
  var searchString = args.slice(1).join(' ');
	var url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	var serverQueue = queue.get(message.guild.id);
    switch (args[0].toLowerCase()) {
      case "mplay":
    var voiceChannel = message.member.voiceChannel;
		if (!voiceChannel) return message.channel.send('Vous devez être dans un salon vocal pour pouvoir lancer une musique');
		var permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT')) {
			return message.channel.send('Je ne peux pas me connecter au salon vocal, merci de vérifier mes permissions.');
		}
		if (!permissions.has('SPEAK')) {
			return message.channel.send('Je ne peux pas parler dans le salon vocal, erci de vérifier mes permissions.');
		}
      if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			var playlist = await youtube.getPlaylist(url);
			var videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				var video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return message.channel.send(`✅ La playlist **${playlist.title}** à été ajouté à la file d'attente.`);
		} else {
			try {
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 10);
					var index = 0;
					message.channel.send(`
__**Song selection:**__
${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}
Please provide a value to select one of the search results ranging from 1-10.
					`);
					// eslint-disable-next-line max-depth
					try {
						var response = await message.channel.awaitMessages(message2 => message2.content > 0 && message2.content < 11, {
							maxMatches: 1,
							time: 10000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return message.channel.send('No or invalid value entered, cancelling video selection.');
					}
					var videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return message.channel.send('🆘 I could not obtain any search results.');
				}
			}
			return handleVideo(video, message, voiceChannel);
		}
        break;
      case "mskip":
		if (!message.member.voiceChannel) return message.channel.send('You are not in a voice channel!');
		if (!serverQueue) return message.channel.send('There is nothing playing that I could skip for you.');
		serverQueue.connection.dispatcher.end('Skip command has been used!');
		return undefined;
        break;
      case "mstop":
		if (!message.member.voiceChannel) return message.channel.send('You are not in a voice channel!');
		if (!serverQueue) return message.channel.send('There is nothing playing that I could stop for you.');
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('Stop command has been used!');
		return undefined;
break;
      case "mvolume":
		if (!message.member.voiceChannel) return message.channel.send('You are not in a voice channel!');
		if (!serverQueue) return message.channel.send('There is nothing playing.');
		if (!args[1]) return message.channel.send(`The current volume is: **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
		return message.channel.send(`I set the volume to: **${args[1]}**`);
break;
      case "mnp":
		if (!serverQueue) return message.channel.send('There is nothing playing.');
		return message.channel.send(`🎶 Now playing: **${serverQueue.songs[0].title}**`);
break;
      case "mqueue":
		if (!serverQueue) return message.channel.send('There is nothing playing.');
		return message.channel.send(`
__**Song queue:**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}
**Now playing:** ${serverQueue.songs[0].title}
		`);
break;
      case "mpause":
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return message.channel.send('⏸ Paused the music for you!');
		}
		return message.channel.send('There is nothing playing.');
break;
      case "mresume":
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return message.channel.send('▶ Resumed the music for you!');
		}
		return message.channel.send('There is nothing playing.');
	

	return undefined;
break;
}
async function handleVideo(video, message, voiceChannel, playlist = false) {
	var serverQueue = queue.get(message.guild.id);
	console.log(video);
	var song = {
		id: video.id,
		title: video.title,
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		var queueConstruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(message.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(message.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(message.guild.id);
			return message.channel.send(`I could not join the voice channel: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return message.channel.send(`✅ **${song.title}** has been added to the queue!`);
	}
	return undefined;
}
  function play(guild, song) {
	var serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
      message.channel.send('``The queue of song is end.``');
			if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`🎶 Start playing: **${song.title}**`);
}
});

bot.login(process.env.TOKEN)


