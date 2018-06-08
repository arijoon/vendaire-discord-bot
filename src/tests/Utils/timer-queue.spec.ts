import { TimerQueue } from '../../components/timer-queue.com';
import { expect } from 'chai';
import 'mocha';

describe('Timer Queue', () => {
  it('It should do the scheduled tasks', async () => {

    const waitTime = 5;
    const queue = new TimerQueue(waitTime);
    const obj = {
      hasCompleted: false,
      hasCompleted2: false,
    };

    queue.doTask(() => obj.hasCompleted = true);
    queue.doTask(() => obj.hasCompleted2 = true);

    await new Promise(r => {
      setTimeout(() => r(), waitTime*2);
    });

    expect(obj.hasCompleted).to.equal(true);
    expect(obj.hasCompleted2).to.equal(true);
  });
});