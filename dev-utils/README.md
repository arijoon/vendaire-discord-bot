# Developer scripts to help with development

## Generating index files from existing directories

interfaces:

```sh
git grep "export interface" | sed -e 's@\(.*\)\.ts.*export interface \([A-za-z]*\).*@export * from "./\1";@g'
```

for classes

```sh
git grep "export class" | sed -e 's@\(.*\)\.ts.*export class \([A-za-z]*\).*@export * from "./\1";@g'
```

generic:

```
git grep "export" | grep -v "index.ts" | sed -e 's@\(.*\)\.ts.*export\([A-za-z]*\).*@export * from "./\1";@g'
```
