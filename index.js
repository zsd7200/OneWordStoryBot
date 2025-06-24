// Import the node modules
import 'dotenv/config';
import { BskyAgent } from '@atproto/api';
import { Client, Events, GatewayIntentBits } from 'discord.js'

const client = new Client({ intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
]});
const agent = new BskyAgent({
    service: 'https://bsky.social',
});
await agent.login({
    identifier: process.env.BSKY_IDENT,
    password: process.env.BSKY_PASS,
});

// create bot prefix
const prefix = './';

// create other variables
let listening = false;
let returnStr = "";
let channel = null;

let atUriToBskyAppUrl = (atUri) => {
  const regex = /^at:\/\/([^/]+)\/([^/]+)\/([^/]+)$/;
  const match = atUri.match(regex);

  if (!match) {
    return null; // Invalid AT URI format
  }

  const did = match[1];
  const collection = match[2];
  const rkey = match[3];

  if (collection === 'app.bsky.feed.post') {
    return `https://bsky.app/profile/${did}/post/${rkey}`;
  } else {
    return null; // Not a post record
  }
};

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on(Events.ClientReady, readyClient => {
    client.user?.setActivity("./start"); // set game upon login
    console.log(`${readyClient.user.tag} is ready to hear your story!`);
});

// create an event listener for messages
client.on(Events.MessageCreate, async message => {
    if(message.author.bot) return;

    // Otherwise ignore any message that does not start with the prefix, 
    // which is set above
    if(message.content.indexOf(prefix) !== 0)
	{
		// if listening is true, add new words to your story
		if(listening === true && channel === message.channel)
		{
			if ((message.content.indexOf(".") == 0 || message.content.indexOf(",") ==  0 || message.content.indexOf("\"") == 0 || message.content.indexOf("?") == 0 || message.content.indexOf("!") == 0 || message.content.indexOf("™") == 0 || message.content.indexOf("“") == 0 || message.content.indexOf("”") == 0 || message.content.indexOf(";") == 0 || message.content.indexOf(":") == 0 || message.content.indexOf("(") == 0 || message.content.indexOf(")") == 0 || message.content.indexOf("[") == 0 || message.content.indexOf("]") == 0 || message.content.indexOf("~") == 0 || message.content.indexOf("-") == 0 || message.content.indexOf("/") == 0) && returnStr != "")
				returnStr = returnStr.slice(0, (returnStr.length - 1));
			
			returnStr += message.content + " ";
		}
		else return;
	}

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === "start")
	{
		if(listening === true && channel === message.channel)
			return message.channel.send("Already listening on this channel! I'll make sure this word isn't logged. :wink:");
		else if (listening === true && channel != message.channel)
			return message.channel.send("Already listening on another channel!");
		
		listening = true;
		channel = message.channel;
		returnStr = "";
		return message.channel.send("Now listening! Type command `./end` to stop listening.\nRemember to end your sentences, close your quotes, write only one word at a time, and have fun!");
	}

	if (command === "end")
	{
		if(channel != message.channel)
			return message.channel.send("`./end` must be run from the same channel that `./start` was called from.");
		
		if (returnStr == "")
			return message.channel.send("You didn't write anything... But I'll keep listening!");
		
		listening = false;
		channel = null;
		
		if (returnStr.length <= 280)
		{
			//T.post('statuses/update', { status: returnStr }, function(err,data,response) { if (err) throw err; });
            await agent.post({
                text: returnStr, 
                createdAt: new Date().toISOString(),
            })
            .then(res => {
                console.log(res);
                message.channel.send(returnStr);
                message.channel.send(atUriToBskyAppUrl(res.uri));
            });
		}
		
		else
			message.channel.send("Sorry, this one was too long for Twitter... But here's your final story:");
	}
});

// log the bot in
client.login(process.env.DISCORD_TOKEN);
