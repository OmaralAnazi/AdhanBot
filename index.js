require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');
const sodium = require('libsodium-wrappers');
const moment = require('moment-timezone');
const { getPrayerTimes } = require('./prayerTimes');

(async () => {
  await sodium.ready;

  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

  let prayerTimes = {};
  const adhanFilePath = path.join(__dirname, 'adhan.mp3');
  const activeConnections = new Map();

  client.once('ready', async () => {
      console.log(`Logged in as ${client.user.tag}`);
      await updatePrayerTimes();
      scheduleAdhan();
      scheduleDailyUpdate();
  });

  async function updatePrayerTimes() {
      prayerTimes = await getPrayerTimes();
      console.log('Updated prayer times:', prayerTimes);
  }

  function scheduleDailyUpdate() {
    const now = moment().tz('Asia/Riyadh');
    const nextMidnight = moment().tz('Asia/Riyadh').endOf('day').add(1, 'second');
    const timeUntilMidnight = nextMidnight.diff(now);

      setTimeout(async () => {
          await updatePrayerTimes();
          scheduleAdhan();
          setInterval(async () => {
              await updatePrayerTimes();
              scheduleAdhan();
          }, 24 * 60 * 60 * 1000);
      }, timeUntilMidnight);
  }

  function scheduleAdhan() {
      console.log('Scheduling Adhan times...');
      const now = moment().tz('Asia/Riyadh');

      for (const [prayer, time] of Object.entries(prayerTimes)) {
          const [hours, minutes] = time.split(':');
          const prayerTime = moment().tz('Asia/Riyadh').set({ hour: parseInt(hours), minute: parseInt(minutes), second: 0 });

          if (prayerTime > now) {
              const delay = prayerTime - now;
              console.log(`Scheduling ${prayer} Adhan in ${delay / 1000 / 60} minutes`);
              setTimeout(() => {
                  console.log(`Playing ${prayer} Adhan now`);
                  playAdhanInVoiceChannels();
              }, delay);
          } else {
              console.log(`${prayer} time has already passed for today`);
          }
      }
  }

  async function playAdhanInVoiceChannels() {
      console.log('Checking voice channels to play Adhan...');
      const voiceChannels = [];

      for (const guild of client.guilds.cache.values()) {
          console.log(`Checking guild: ${guild.name}`);

          const channels = guild.channels.cache;
          const activeVoiceChannels = channels.filter(channel => channel.type === 2 && channel.members.size > 0);

          for (const voiceChannel of activeVoiceChannels.values()) {
              console.log(`Found active voice channel: ${voiceChannel.name} in guild: ${guild.name} with ${voiceChannel.members.size} members`);
              voiceChannels.push(voiceChannel);
          }
      }

      for (const channel of voiceChannels) {
          await playSound(channel);
      }
      scheduleAdhan();
  }

  async function playSound(channel) {
    return new Promise((resolve, reject) => {
        try {
            console.log(`Attempting to join channel: ${channel.name} in guild: ${channel.guild.name}`);
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();
            const resource = createAudioResource(adhanFilePath, { inlineVolume: true });
            resource.volume.setVolume(0.1);

            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
                activeConnections.delete(channel.id);
                console.log(`Finished playing in ${channel.guild.name} in channel: ${channel.name}`);
                resolve();
            });

            player.on('error', error => {
                console.error(`Error playing audio in ${channel.guild.name} in channel: ${channel.name}:`, error);
                connection.destroy();
                activeConnections.delete(channel.id);
                reject(error);
            });

            activeConnections.set(channel.id, connection);
            console.log(`Playing Adhan in ${channel.guild.name} in channel: ${channel.name}`);
        } catch (error) {
            console.error(`Failed to join voice channel: ${channel.name} in guild: ${channel.guild.name}`, error);
            reject(error);
        }
    });
  }

  client.login(process.env.DISCORD_BOT_TOKEN);
})();
