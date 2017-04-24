import { Indentation } from './../helpers/indentation.helper';
import { commands } from "./commands";

let indent = new Indentation();

let helpContent = {
    usage: `Usage: ${commands.prefix}[commands] [optional arguments]\n\n`
}

indent.inc();
helpContent.usage += `${indent}Commands:\n\n`

indent.inc();
helpContent.usage += `${indent}help| --help            \tShow this prompt\n`
helpContent.usage += `${indent}trump                   \tPlay trump audio in your current voice channel\n`
helpContent.usage += `${indent}qs                      \tPost a random question\n`
helpContent.usage += `${indent}yt {text}               \tPost first result of youtube search for text\n`
helpContent.usage += `${indent}tfw                     \tPost a feel pic\n`
helpContent.usage += `${indent}bog                     \tPost a bog pic\n`
helpContent.usage += `${indent}tsu                     \tPost a tsuuuu pic\n`
helpContent.usage += `${indent}god                     \tPost a god pic\n`
helpContent.usage += `${indent}call                    \tPost a call pic\n`
helpContent.usage += `${indent}exposed                 \tPost an exposed pic\n`
helpContent.usage += `${indent}lol                     \tPost a lol pic \n`
helpContent.usage += `${indent}quickrundown            \tPost quickrundown pic with description\n`
helpContent.usage += `${indent}regional {text}         \tPost your text in regional format\n`
helpContent.usage += `${indent}spaceout {text}         \tSpace out each character and add column\n`
helpContent.usage += `${indent}rate {name|link}        \tRates the subject out of 10\n`
helpContent.usage += `${indent}math {expression}       \tEvaluates the mathematical expression\n`
helpContent.usage += `${indent}is{somthing} {text}     \tRandomize whether something is text\n`
helpContent.usage += `${indent}are{somethings} {text}  \tRandomize whether something are text\n`
helpContent.usage += `${indent}does{somethings} {text} \tRandomize whether something does text\n`

export { helpContent }