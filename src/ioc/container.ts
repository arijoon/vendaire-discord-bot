import { Container } from 'inversify';
import { SayHello } from '../commands/say-hello.command';
import { TYPES } from "./types";
import { Client } from "../client";
import { IClient } from "../contracts/IClient";
import { ICommand } from "../contracts/ICommand";

console.log("[+] Building container");

let container = new Container();

container.bind<IClient>(TYPES.IClient).to(Client).inSingletonScope();

// Bind commands
container.bind<ICommand>(TYPES.ICommand).to(SayHello);

export { container };