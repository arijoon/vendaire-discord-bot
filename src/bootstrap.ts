import "reflect-metadata";
import { ICommand } from './contracts/ICommand';
import { container } from "./ioc/container";
import { TYPES } from "./ioc/types";

let commands: ICommand[] = container.getAll<ICommand>(TYPES.ICommand);

// Attach all commands
for(let i = 0; i < commands.length; i++) {
    commands[i].attach()
}

console.log("[+] Attahed " + commands.length + " commands");