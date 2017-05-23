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

    public New() {
        return new DiscordMessage(this.GuildId, this.MessageId, this.ChannelId);
    }
}
