const { 
    Client, 
    GatewayIntentBits, 
    ApplicationCommandOptionType, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
const port = 3000;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
    ],
});

const uri = process.env.MONGODB;
const ddb = new MongoClient(uri);

// Generate a unique 12-digit code from user ID
function generateUniqueCode(userID) {
    const hash = crypto.createHash('sha256').update(userID).digest('hex');
    return hash.padEnd(12, '0').slice(0, 12);
}

// Store a code in the database
async function storeCode(code) {
    try {
        await ddb.connect();
        const db = ddb.db('authCode');
        const result = await db.collection('codes').insertOne({ code });
        console.log('Code stored with _id:', result.insertedId);
    } catch (err) {
        console.error('Error storing code:', err);
    }
}

// Discord bot ready event
client.once('ready', async () => {
    console.log('Bot is on');

    const guildID = process.env.SERVER_ID; 
    const guild = client.guilds.cache.get(guildID);
    let commands = guild ? guild.commands : client.application?.commands;

    await commands?.create({
        name: 'verifypost',
        description: 'Send a verify post',
    });
    await commands?.create({
        name: 'codepost',
        description: 'Send a beta code post',
    });
});

// Express server
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'codepost') {
        const embed = new EmbedBuilder()
            .setImage('https://media.discordapp.net/attachments/1397423844725231748/1397449903667413063/image.png?ex=6881c424&is=688072a4&hm=b5e5a50f740d07a6128544759b02be9ee50bf4b015e7ae3291c794f719237acf&=&format=webp&quality=lossless&width=930&height=930')
            .setTitle('**Beta Bot Pre-Release Code**')
            .setDescription(`
**Obtain your personal Beta Bot Pre-Release Code by clicking the button below!** These codes will only be generated before Pet Fighters releases, so make sure to grab one now 👀

*Please note codes are redeemable once per account after Pet Fighters releases, **DO NOT** share your code with anyone.*
`)
            .setColor('#f5da1a')
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('gencode')
                .setLabel('Get Verification Code')
                .setStyle(ButtonStyle.Primary)
        );

        return await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: false,
        });
    }

    if (interaction.commandName === 'verifypost') {
        const embed = new EmbedBuilder()
            .setTitle('**Discord Verification**')
            .setDescription(`Once you click get verification code, we'll send you an exclusive verification code through DM's! Once you receive this code, input it into the codes menu in game. Once done, you'll be granted your exclusive rewards!`)
            .setColor('#f5da1a')
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('genverifycode')
                .setLabel('Get Verification Code')
                .setStyle(ButtonStyle.Primary)
        );

        return await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: false,
        });
    }
});

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // Beta code button
    if (interaction.customId === 'gencode') {
        const userID = interaction.user.id;
        const code = generateUniqueCode(userID);
        const db = ddb.db('authCode');
        const found = await db.collection('codes').findOne({ code });

        try {
            await interaction.user.send(`
Here's your beta bot pre release code: **${code}**

*Please note: This code is redeemable once per account after Pet Fighters releases. Do not share it with anyone.*
`);
            if (!found) {
                await storeCode(code);
            }
        } catch (err) {
            // Optionally handle DM failure
        }
    }

    // Verification code button
    if (interaction.customId === 'genverifycode') {
        const userID = interaction.user.id;
        const code = generateUniqueCode(userID).split('').reverse().join('');
        const db = ddb.db('authCode');
        const found = await db.collection('verifycode').findOne({ code });

        try {
            await interaction.user.send(`Here's your verification code: **${code}**

*Please note: This code is a one time use and expires after you redeem it in game. Do not share it with anyone.*
`);
            if (!found) {
                await storeCode(code);
            }
        } catch (err) {
            // Optionally handle DM failure
        }
    }
});

// API endpoint: verify code (for verification codes)
app.post('/api/verify', async (req, res) => {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ result: false, message: 'Invalid or missing code.' });
    }

    try {
        const db = ddb.db('authCode');
        const verifycodes = db.collection('verifycode');
        const found = await verifycodes.findOne({ code, used: { $ne: true } });

        if (found) {
            await verifycodes.updateOne({ _id: found._id }, { $set: { used: true } });
            return res.json({ result: true });
        } else {
            return res.json({ result: false });
        }
    } catch (err) {
        console.error('MongoDB error:', err);
        return res.status(500).json({ result: false, message: 'Database error.' });
    }
});

// API endpoint: claim code (for beta codes)
app.post('/api/claim', async (req, res) => {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ result: false, message: 'Invalid or missing code.' });
    }

    try {
        const db = ddb.db('authCode');
        const codes = db.collection('codes');
        const found = await codes.findOne({ code, used: { $ne: true } });

        if (found) {
            await codes.updateOne({ _id: found._id }, { $set: { used: true } });
            return res.json({ result: true });
        } else {
            return res.json({ result: false });
        }
    } catch (err) {
        console.error('MongoDB error:', err);
        return res.status(500).json({ result: false, message: 'Database error.' });
    }
});

client.login(process.env.TOKEN);



