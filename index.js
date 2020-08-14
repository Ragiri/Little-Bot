import { Client, GuildMember } from 'discord.js';
import { prefix, token } from './config.json'
const ytdl = require('ytdl-core');
var search = require('youtube-search');

const bot = new Client();
const queue = new Map();
var opts = {
    maxResults: 10,
    key: 'AIzaSyBpAsw1J8vphBNW1pADJstkjBiwf1Xh1tc'
};

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    console.log(bot.channels);
    bot.channels.cache.get('486540029368336385').send('Hey');
})

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

bot.on('message', async msg => {
    if (!msg.content.startsWith(prefix) || msg.author.bot)
        return;
    const comp = msg.content.slice(prefix.length).split(' ').shift().toLowerCase();
    const serverQueue = queue.get(msg.guild.id);
    if (comp == "truc")
        bot.channels.cache.get(msg.channel.id).send('bidule');
    else if (comp == "test") {
        if (msg.member.roles.cache.has('726000527351218228'))
        bot.channels.cache.get(msg.channel.id).send('You have the test permissions yeah !');
        else
            msg.reply(' You don’t have test permissions');
    }else if (comp == "set_test") {
        msg.member.roles.add('726000527351218228');
        bot.channels.cache.get(msg.channel.id).send(`Test permissions added to user ${msg.member.user.username}`);
    }else if (comp == "rm_test") {
        msg.member.roles.remove('726000527351218228');
        bot.channels.cache.get(msg.channel.id).send(` no longer have Test`);
    }else if (comp == "rm_msg") {
        msg.delete();
        bot.channels.cache.get(msg.channel.id).send('Message has been deleted');
    }else if (comp == "rm_after_2sec") {
        msg.delete({timeout: 2000});
        bot.channels.cache.get(msg.channel.id).send('Message has been deleted after 2sec');
    }else if (comp == "rm_all_msg") {
        async function clear() {
            var fetched = await msg.channel.messages.fetch();
            msg.channel.bulkDelete(fetched);
        }
        clear();
        bot.channels.cache.get(msg.channel.id).send('Deleting all messages');
    }else if (comp == 'play') {
        async function execute() {
          const args = msg.content.split(" ");
          if (args.length == 1)
            return msg.channel.send("You need to add an URL music");
          const voiceChannel = msg.member.voice.channel;
          var InfoSong;
          if (!voiceChannel)
            return msg.channel.send("You need to be in a voice channel to play music!");
          const permissions = voiceChannel.permissionsFor(msg.client.user);
          if (!permissions.has("CONNECT") || !permissions.has("SPEAK"))
            msg.channel.send("I need the permissions to join and speak in your voice channel!");
          if (args[1].indexOf("http") == 0) {
            InfoSong = await ytdl.getInfo(args[1]);
            const song = {
                title: InfoSong.title,
                url: InfoSong.video_url
              };
            if (!serverQueue) {
              const queueContruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
              };
              queue.set(msg.guild.id, queueContruct);
              queueContruct.songs.push(song);
              try {
                  var connection = await voiceChannel.join();
                  queueContruct.connection = connection;
                  play(msg.guild, queueContruct.songs[0]);
              } catch (err) {
                  console.log(err);
                  queue.delete(msg.guild.id);
                  return msg.channel.send(err);
                  }
              } else {
                  serverQueue.songs.push(song);
                  return msg.channel.send(`${song.title} has been added to the queue!`);
            }
          } else {
            var title = "";
            var video = "";
            for (var i = 1; args[i]; i++)
                title += args[i] + " ";
            var truc = title;
            search(truc, opts, async function(err, results) {
                if(err)
                    return console.log(err);
              video = await results[1].link;
              console.log(results[1].link);
              InfoSong = await ytdl.getInfo(video);
              const song = {
                title: InfoSong.title,
                url: InfoSong.video_url
              };
            if (!serverQueue) {
              const queueContruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
              };
              queue.set(msg.guild.id, queueContruct);
              queueContruct.songs.push(song);
              try {
                  var connection = await voiceChannel.join();
                  queueContruct.connection = connection;
                  play(msg.guild, queueContruct.songs[0]);
              } catch (err) {
                  console.log(err);
                  queue.delete(msg.guild.id);
                  return msg.channel.send(err);
                  }
              } else {
                  serverQueue.songs.push(song);
                  return msg.channel.send(`${song.title} has been added to the queue!`);
            }
            });
          }
        }
        execute()     
    } else if (comp == 'skip') {
      if (!msg.member.voice.channel)
        return msg.channel.send("You have to be in a voice channel to stop the music!");
      if (!serverQueue)
        return msg.channel.send("There is no song that I could skip!");
      serverQueue.connection.dispatcher.end();
    } else if (comp == 'stop') {
      if (!msg.member.voice.channel)
        return mgs.channel.send("You have to be in a voice channel to stop the music!");
      serverQueue.songs = [];
      serverQueue.connection.dispatcher.end();
      return msg.channel.send("I stop the music");
    } else if (comp == 'list') {
      var list = ""; 
      for (var i = 0; serverQueue.songs[i]; i++) {
        if (i == 0)
            list += "Playing " +serverQueue.songs[i].title + "\n";
        else  
            list += i + ". " +serverQueue.songs[i].title + "\n";
      }
      msg.channel.send(list);
    } else if (comp == "pause") {
      if (!msg.member.voice.channel)
        return mgs.channel.send("You have to be in a voice channel to stop the music!");
      serverQueue.connection.dispatcher.pause();
      msg.channel.send("Pause, tape %resume for resume the music");
    }else if (comp == "resume") {
      if (!msg.member.voice.channel)
        return mgs.channel.send("You have to be in a voice channel to stop the music!");
      serverQueue.connection.dispatcher.resume();
      msg.channel.send("Music is resume");
    } else if (comp == 'help') {
        msg.channel.send("Command\tEffect\ntruc\trespond bidule\ntest\tverify if you have test roles\nset_test\tgive test role\nrm_test\tremove test role rm_msg\tremove last message\nrm_all_msg\t remove all message of a channel\nplay\tplay a music with name of search or url\nskip\tskip to next music\nstop\tstop music\npause\tpause the music\nresume\tresume the music\nlist\tlist the playlist");
    } else
        bot.channels.cache.get(msg.channel.id).send("You need to enter a valid command!");
});

bot.on('reconnecting', () => {
 console.log('Reconnecting!');
});

bot.on('disconnect', () => {
 console.log('Disconnect!');
});

bot.on
bot.login(process.env.token);