import 'reflect-metadata';
import './extensions/index';
import { container } from './ioc/container';
import { TYPES } from './ioc/types';
import { IClient } from './contracts';

const commands: ICommand[] = container.getAll<ICommand>(TYPES.ICommand);
const client: IClient = container.get<IClient>(TYPES.IClient);
const logger: ILogger = container.get<ILogger>(TYPES.Logger);
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

logger.info("Attahed " + commands.length + " command" + (commands.length > 1 ? "s" : ""));
logger.info(`Attached ${helps.length} helps`)

container.get<IStartable>(TYPES.AleksaServer).start()
  .then(() => logger.info("Aleksa server started"))
  .catch((err) => logger.error("Failed to stat aleksa server", err))

container.get<IStartable>(TYPES.Server).start()
  .then(() => logger.info("Default server started"))
  .catch((err) => logger.error("Failed to stat default server", err))

function instanceOfHasHelp(object: any): object is IHasHelp {
  return 'getHelp' in object;
}