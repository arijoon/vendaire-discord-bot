import "reflect-metadata";
import './extensions/index';
import { ICommand } from './contracts/ICommand';
import { container } from "./ioc/container";
import { TYPES } from "./ioc/types";
import { IClient } from "./contracts/IClient";

const commands: ICommand[] = container.getAll<ICommand>(TYPES.ICommand);
const client: IClient = container.get<IClient>(TYPES.IClient);
const helps: IHelp[] = [];

// Attach all commands
for (let i = 0; i < commands.length; i++) {
  let command = commands[i];
  command.attach()

  if(instanceOfHasHelp(command)) {
    // This command is IHasHelp
    const cmd: IHasHelp = command as any;

    helps.push.apply(helps, cmd.getHelp());
  }
}

client.attachHelp(helps);

console.log("[bootstrap.ts] Attahed " + commands.length + " command" + (commands.length > 1 ? "s" : ""));
console.log(`[bootstrap.ts] attached ${helps.length} helps`)

function instanceOfHasHelp(object: any): object is IHasHelp {
  return 'getHelp' in object;
}