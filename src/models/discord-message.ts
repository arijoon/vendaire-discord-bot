export class DiscordMessage {
    GuildId: string;
    MessageId: string;
    ChannelId: string;

    Timestamp: number;

    constructor(guildId?: string, messageId?: string, channelId?: string) {
        this.GuildId = guildId;
        this.MessageId = messageId;
        this.ChannelId = channelId;

        this.Timestamp = Date.now();
    }
}
