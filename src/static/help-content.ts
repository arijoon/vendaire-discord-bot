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
helpContent.usage += `${indent}sayHello\t\tsay hello to you\n`

export { helpContent }