import { createRecursive, getAllFilesRecursive } from '../../helpers';
import { expect } from 'chai';
import * as fs from 'fs';
import 'mocha';

describe('Search directory for files recursively', () => {
  it('it should search directory for all the files', () => {

    const path = "E:\\tmp\\";
    const files = getAllFilesRecursive(path);

    expect(files.length).to.equal(5);
  });
});

describe('Create directory redursively', () => {
  it('it should create the directory', () => {

    const path = "E:\\tmp\\a\\b\\c\\d";
    createRecursive(path);

    expect(fs.existsSync(path)).to.equal(true);
  });
});
