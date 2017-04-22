import "reflect-metadata";
import './extensions/index';
import { ICommand } from './contracts/ICommand';
import { container } from "./ioc/container";
import { TYPES } from "./ioc/types";

let commands: ICommand[] = container.getAll<ICommand>(TYPES.ICommand);

// Attach all commands
for(let i = 0; i < commands.length; i++) {
    commands[i].attach()
}

console.log("[bootstrap.ts] Attahed " + commands.length + " command" + (commands.length > 1 ? "s" : ""));