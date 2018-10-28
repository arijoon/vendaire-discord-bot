import { createRecursive, getAllFilesRecursive, getAllFoldersRecursive, getAllFoldersStatRecursively } from '../../helpers';
import { expect } from 'chai';
import * as fs from 'fs';
import 'mocha';

describe('Search directory for files recursively', () => {
  xit('it should search directory for all the files', () => {

    const path = "E:\\tmp\\";
    const files = getAllFilesRecursive(path);

    expect(files.length).to.equal(5);
  });

  xit('it should get all the folders', () => {

    const path = "E:\\tmp\\";
    const folders = getAllFoldersRecursive(path);

    expect(folders.length).to.equal(5);
  });

  it('it should get all the folders structures', () => {

    const path = "E:\\tmp\\";
    const folders = getAllFoldersStatRecursively(path);

    expect(folders.length).to.equal(5);
  });
});

describe('Create directory redursively', () => {
  xit('it should create the directory', () => {

    const path = "E:\\tmp\\a\\b\\c\\d";
    createRecursive(path);

    expect(fs.existsSync(path)).to.equal(true);
  });
});
