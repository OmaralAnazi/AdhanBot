# Discord Adhan Bot

This is a Discord bot that plays the Adhan at prayer times in voice channels. The bot fetches prayer times from the Aladhan API and schedules the Adhan for each prayer time. It joins the voice channels one by one and plays the Adhan audio file.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/OmaralAnazi/AdhanBot.git
   cd discord-adhan-bot
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a .env file in the root directory and add your Discord bot token:

   ```bash
   DISCORD_BOT_TOKEN=your-bot-token
   ```

4. Start the bot

   ```bash
   npm start
   ```
