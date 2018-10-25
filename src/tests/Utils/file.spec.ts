import { createRecursive } from '../../helpers';
import { expect } from 'chai';
import * as fs from 'fs';
import 'mocha';

describe('Create directory redursively', () => {
  it('it should create the directory', () => {

    const path = "E:\\tmp\\a\\b\\c\\d";
    createRecursive(path);

    expect(fs.existsSync(path)).to.equal(true);
  });
});
