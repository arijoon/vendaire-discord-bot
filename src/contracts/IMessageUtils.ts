import { Message } from "discord.js";

export interface IMessageUtils {
    Delete(msg: Message): Promise<any>
}