import { RemindCommand } from '../commands';
import { StubClient, StubMessage, StubOrderedSetDataAccess } from './stubs';
import { expect, assert } from 'chai';
import 'mocha';

export { expect };

describe('Basic reminder setting', () => {
  it('can read a message and seperate the correct values', async () => {
    const time = Date.now();
    const client = new StubClient();
    const dataAccess = new StubOrderedSetDataAccess();
    const msg = new StubMessage("@arijoon, @tom to \"do some stuff\" in 1 minute", "", "1");
    const command = new RemindCommand(client, dataAccess);

    command.attach();

    client.postMessage(msg);

    await msg.donePromise;

    const result = await dataAccess.getRange("", time, time+(60*3*1000), 10);

    expect(result).to.have.lengthOf(1);

    const first = result[0];

    // Message id
    expect(first).to.have.property('value');
    const value = JSON.parse(first.value);

    expect(value.msgId).to.equal("1");
    expect(value.message).to.equal("do some stuff");

    const timeUp = time + (60*2*1000)
    const isValidTime: boolean = first.key < timeUp && first.key > time;
    assert.isTrue(isValidTime, `Time is not in range ${first.key}`);
  });
});