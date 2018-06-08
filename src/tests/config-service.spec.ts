import { Config } from '../services';
import { expect } from 'chai';
import 'mocha';

describe('Secret collecton', () => {
  it('Should merge env variables with the existing collection', () => {
    process.env["DiscordBot_redis_server"] = "myserver";
    process.env["DiscordBot_redis_port"] = "myPort";

    const configService = new Config();
    const secret = configService.secret;

    expect(secret.redis.server).to.equal("myserver");
    expect(secret.redis.port).to.equal("myPort");
  });
});