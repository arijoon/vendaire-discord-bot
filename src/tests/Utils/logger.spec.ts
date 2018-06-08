import { Logger } from '../../helpers/logger';
import { expect } from 'chai';
import 'mocha';

const mockConsole = {
  logs: [],
  log: function() {
    mockConsole.logs.push({args: arguments})
  },

  error: function() {
    mockConsole.logs.push({args: arguments})
  }
}

describe('Logger trace', () => {
  it('it should attach filename and line numbers', () => {

    const logger = new Logger(mockConsole);
    logger.info("hello world", "some bullshit");
    logger.error("hello world", new Error("Shit hit the fan"));

    expect(mockConsole.logs.length).to.equal(2);

  });
});
