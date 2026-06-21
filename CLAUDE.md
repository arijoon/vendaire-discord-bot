# CLAUDE.md

Guidance for working in this repository.

## What this is

**Vandaire** (package name `vandaire`) is a Discord bot written in TypeScript. It
listens for prefixed text commands in Discord channels and runs a matching
command handler for each message. It also exposes a small Express server and an
optional Alexa ("Aleksa") integration.

## Stack

- **TypeScript** (CommonJS, target es2015) — see `tsconfig.json`. Sources in
  `src/`, compiled to `build/`.
- **discord.js v14** for the Discord gateway/client.
- **InversifyJS** for dependency injection (IoC).
- **RxJS** — each command subscribes to an observable stream of its messages.
- **Redis** for caching (optional; enabled via config).
- Built and packaged with **Nix** (`default.nix`, `shell.nix`, `nix/`) and
  **Docker** (`docker-compose.yml`, `Dockerfile`).

## Architecture

- `src/bootstrap.ts` — entry point. Resolves every `ICommand` binding from the
  IoC container, calls `attach()` on each, collects help text, and starts the
  servers.
- `src/ioc/container.ts` + `src/ioc/types.ts` — DI registrations. Every command
  is bound to `TYPES.ICommand`; new commands must be registered here.
- `src/client.ts` — wraps the Discord client. Parses incoming messages: strips
  the configured prefix, matches the first word against registered commands, and
  pushes an `IMessage` onto that command's stream. The remainder of the message
  (after the command word) becomes `IMessage.Content`. Supports `--help` and a
  pipe syntax.
- `src/commands/` — one file per command. `src/commands/index.ts` re-exports them.
- `src/contracts/` — interfaces. **Most are declared as global ambient types**
  (no `export`), so commands reference `ICommand`, `IConfig`, `IHttp`,
  `IBasicCache`, `IHelp`, `IHasHelp`, etc. without importing them. A few (e.g.
  `IMessage`, `IClient`) are exported and imported normally.
- `src/services/` — injectable services (HTTP, cache, files, etc.).
- `src/extensions/` — prototype extensions loaded in `bootstrap.ts`, e.g.
  `Array.prototype.crandom()` (random element) and `popRandom()` (remove+return
  a random element).
- `src/static/commands.ts` — the canonical list of command name strings.

### Anatomy of a command

A command is an `@injectable()` class implementing `ICommand` (and optionally
`IHasHelp`). It typically:

1. Sets `_command = commands.<name>` (from `src/static/commands.ts`).
2. In `attach()`, subscribes to `this._client.getCommandStream(this._command)`.
3. Handles each `IMessage`, branching on `imsg.Content`, then calls
   `imsg.send(response)` and `imsg.done()` (or `imsg.done(err, true)` on error).

To add a command: create the file under `src/commands/`, export it from
`src/commands/index.ts`, add its name to `src/static/commands.ts`, and bind it to
`TYPES.ICommand` in `src/ioc/container.ts`.

## Config

- `src/app.config.json` — non-secret app config (committed). Includes the `api`
  map of external endpoints, asset paths, per-command settings, and env-specific
  `env.<development|production>` blocks (e.g. `prefix`, `cache`).
- `src/config.secret.json` — secrets (Discord token, keys, etc.); not committed.
  See `config.secret.json.template`.
- Config is injected as `IConfig` (`TYPES.IConfig`); e.g. `config.api['<key>']`
  reads an endpoint, `config.app.<key>` reads merged app config.

Resolution order in `src/services/config.service.ts` (later wins):
`app.config.json` → its `env[NODE_ENV]` block → `config.secret.json` (deep
merge, **overrides** app config) → `DiscordBot_*` env vars (`_` separates
levels). So any app-config value, e.g. the command `prefix`, can be overridden
by adding it to `config.secret.json` or via a `DiscordBot_prefix` env var.

- `config.root` (from `config.secret.json`) is the base directory for
  `config.pathFromRoot(...)`, which resolves assets like fonts, images, and
  certs. In the Docker image this is `/app` (assets are symlinked at
  `/app/assets`); **for local dev set `root` to your repo checkout** or
  asset-path lookups (e.g. `registerFont` in the `hesays` command) will fail with
  `ENOENT … '/app'`.

## Build & run

No `node_modules` is checked in and the local toolchain is provided by Nix, so
`tsc`/`ts-node` may not be on PATH directly. Common commands (see
`package.json`):

- `yarn dev:run` — run from source with ts-node (development).
- `npm run compile` — clean + `tsc` + copy JSON files into `build/`.
- `npm start` — compile then run `build/bootstrap.js`.
- `yarn tsc-validate` — type-check only (`tsc --noEmit`).
- Nix/Docker: build via `default.nix`; deploy via `docker-compose.yml`.

### Node version & native modules

The project pins **Node 18** (`nodejs-18_x` in `default.nix`). Some deps are
native addons compiled at install time via `node-gyp`/`node-pre-gyp` (notably
`canvas`, `@discordjs/opus`). **The Node used to build a native module must match
the Node used to run it**, or you get errors like a missing `v8::AccessorSignature`
symbol (a binary built for one Node ABI loaded under another).

Gotcha: nixpkgs' `yarn` is wrapped with the *default* nodejs (currently v20), so
`yarn`-driven installs/lifecycle scripts would build natives against the wrong
Node even though `node` on PATH is 18. `default.nix` fixes this with
`yarn = pkgs.yarn.override { inherit nodejs; };` — keep yarn and node aligned. To
rebuild a native module by hand, use the project's Node 18, e.g.:
`cd node_modules/canvas && node ../@mapbox/node-pre-gyp/bin/node-pre-gyp rebuild --build-from-source`.

## Editor / IDE

Point VS Code at the workspace TypeScript so it matches the build compiler:
`.vscode/settings.json` sets `typescript.tsdk` to `node_modules/typescript/lib`
(then run "TypeScript: Select TypeScript Version → Use Workspace Version"). The
project uses legacy `experimentalDecorators`; a newer bundled TypeScript will
otherwise flag the `@inject(...)` parameter decorators with `ts(1239)` even
though `tsc` from the project builds cleanly.
