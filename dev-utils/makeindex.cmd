git grep "export" | grep -v "index.ts" | sed -e 's@\(.*\)\.ts.*export\([A-za-z]*\).*@export * from "./\1";@g' > index.ts