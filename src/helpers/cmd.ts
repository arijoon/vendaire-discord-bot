import { exec as e } from 'child_process';
const util = require('util');
const exec = util.promisify(e);

/**
 * Execute a command on command line and get the response
 * @param command command to execute
 * @param logger 
 * @returns stdout/stderr response
 */
export async function runCommand(command: string, logger: ILogger) {
  const {stdout, stderr} = await exec(command);

  logger.info(`Command: ${command}, returns ${stdout}`);
  if (stderr)
    logger.error(stderr);

  return stdout;
}
