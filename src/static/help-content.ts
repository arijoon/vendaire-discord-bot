import { Indentation } from './../helpers/indentation.helper';
import { commands } from "./commands";

let indent = new Indentation();

let helpContent = {
    usage: `Usage: ${commands.prefix}[commands] [optional arguments]\n\n`
}

indent.inc();
helpContent.usage += `${indent}Commands:\n\n`

indent.inc();
helpContent.usage += `${indent}help| --help\tshow this prompt\n`
helpContent.usage += `${indent}trump       \tPlay glorious trump audio in your current voice channel\n`
helpContent.usage += `${indent}tfw         \tpost a feel pic\n`
helpContent.usage += `${indent}bog         \tpost a bog pic\n`
helpContent.usage += `${indent}tsu         \tpost a tsuuuu pic\n`
helpContent.usage += `${indent}god         \tpost a god pic (usually trump) pic\n`
helpContent.usage += `${indent}quickrundown\tpost quickrundown pic with description\n`

export { helpContent }