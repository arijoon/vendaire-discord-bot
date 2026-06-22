{ sources ? import ./nix/sources.nix
, pkgs ? import sources.nixpkgs { inherit system; config.allowUnfree = true; }
, nix-filter ? import sources.nix-filter
, system ? builtins.currentSystem
}:

let
  nodejs = pkgs.nodejs-18_x;
  yarn = pkgs.yarn.override { inherit nodejs; };

  pname = "vandaire";
  version = "1.0.0";
  src = nix-filter {
    root = ./.;
    include = [
      "src"
      "package.json"
      "yarn.lock"
      "tsconfig.json"
    ];
    exclude = [
      (nix-filter.matchExt "secret.json")
      "src/app.config.json"
    ];
  };

  nativeBuildDeps = with pkgs; [
    pkg-config
    python3
    nodejs.pkgs.node-gyp
    libjpeg.dev
    giflib
    cairo.dev
    pango.dev
    pixman
    fontconfig
    freetype
    glib.dev
    harfbuzz.dev
    librsvg.dev
    gdk-pixbuf.dev
  ];

  yarnOfflineCache = pkgs.fetchYarnDeps {
    yarnLock = ./yarn.lock;
    sha256 = "sha256-Kvu5X69ziR2zdjUC/Kp75JvacB8r/0BlfNlyaujgbCg=";
  };

  # node_modules (incl. the native canvas build) live in their own derivation
  # keyed only on package.json + yarn.lock. Editing TypeScript sources does not
  # change these inputs, so this expensive step is reused from the Nix store
  # instead of re-running yarn install / rebuilding native deps every time.
  nodeModules = pkgs.stdenv.mkDerivation {
    pname = "${pname}-node-modules";
    inherit version;

    src = nix-filter {
      root = ./.;
      include = [ "package.json" "yarn.lock" ];
    };

    nativeBuildInputs = [ nodejs yarn pkgs.fixup-yarn-lock ] ++ nativeBuildDeps;

    buildPhase = ''
      export HOME=$TMPDIR
      export npm_config_nodedir=${nodejs}
      yarn config --offline set yarn-offline-mirror ${yarnOfflineCache}
      fixup-yarn-lock yarn.lock
      yarn install --offline --frozen-lockfile --ignore-scripts --no-progress
      patchShebangs node_modules
      cd node_modules/canvas
      node ../../node_modules/@mapbox/node-pre-gyp/bin/node-pre-gyp install --fallback-to-build --build-from-source
      cd ../..
      patchShebangs node_modules
    '';

    installPhase = ''
      mkdir -p $out
      cp -r node_modules $out/
    '';
  };

  # Source-only build: just compiles TypeScript against the prebuilt
  # node_modules. This is the only derivation that rebuilds on a source change.
  app = pkgs.stdenv.mkDerivation {
    inherit pname version src;

    nativeBuildInputs = [ nodejs ];

    buildPhase = ''
      ln -s ${nodeModules}/node_modules ./node_modules
      node node_modules/typescript/bin/tsc
      node node_modules/copyfiles/copyfiles -u 1 "src/**/*.json" build/
    '';

    installPhase = ''
      mkdir -p $out
      cp -r build package.json $out/
      ln -s ${nodeModules}/node_modules $out/node_modules
    '';
  };

  runtimeDeps = pkgs.buildEnv {
    name = "${pname}-runtime";
    paths = with pkgs; [
      nodejs
      bash
      coreutils
      ffmpeg
      imagemagick
      gallery-dl
      cairo
      pango
      giflib
      libjpeg
      librsvg
    ];
  };

  appDir = pkgs.runCommand "${pname}-appdir" {} ''
    mkdir -p $out/app
    ln -s ${app}/build $out/app/build
    ln -s ${app}/node_modules $out/app/node_modules
    ln -s ${app}/package.json $out/app/package.json
    ln -s /assets $out/app/assets
  '';

  startScript = pkgs.writeShellScript "start-${pname}" ''
    ln -sf /config/config.secret.json ${app}/build/config.secret.json
    ln -sf /config/app.config.json ${app}/build/app.config.json
    ln -sf /config/gallery-dl.conf /tmp/.gallery-dl.conf
    exec ${nodejs}/bin/node ${app}/build/bootstrap.js
  '';

  dockerImage = pkgs.dockerTools.buildLayeredImage {
    name = pname;
    tag = "latest";
    contents = [ app appDir runtimeDeps pkgs.dockerTools.binSh ];
    extraCommands = "mkdir -p tmp config assets discord-ui";
    config = {
      Cmd = [ "${startScript}" ];
      WorkingDir = "/app";
      Env = [
        "NODE_ENV=production"
        "HOME=/tmp"
        "PATH=${runtimeDeps}/bin"
        "SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
      ];
    };
  };

  buildDocker = pkgs.writeShellScriptBin "build-docker" ''
    set -euo pipefail
    args=()
    [ -n "''${1:-}" ] && args+=(--argstr system "$1")
    nix-build ${toString ./.}/default.nix -A dockerImage "''${args[@]}"
  '';

  loadDocker = pkgs.writeShellScriptBin "load-docker" ''
    set -euo pipefail
    args=()
    [ -n "''${1:-}" ] && args+=(--argstr system "$1")
    image=$(nix-build ${toString ./.}/default.nix -A dockerImage --no-out-link "''${args[@]}")
    docker load < "$image"
    echo "Loaded image: ${pname}:latest"
  '';

  updateCompose = pkgs.writeShellScriptBin "update-compose" ''
    set -euo pipefail
    compose="''${1:-${toString ./.}/docker-compose.yml}"
    ${pkgs.gnused}/bin/sed -i '/^\s*build:/,/^\s*args:/{
      /^\s*build:/s|.*|    image: ${pname}:latest|
      /^\s*context:/d
      /^\s*args:/d
      /^\s*EXTRA_PATH:/d
    }' "$compose"
    echo "Updated $compose to use image: ${pname}:latest"
  '';

in {
  inherit app nodeModules yarnOfflineCache dockerImage;
  inherit buildDocker loadDocker updateCompose;

  deps = with pkgs; [
    nodejs
    yarn
    python310
    nodejs.pkgs.node-gyp
    libjpeg.dev
    giflib
    fontconfig
    pixman
    cairo
    pango
    glib
    harfbuzz
    librsvg
    gdk-pixbuf
    imagemagick.dev
  ];

  shell = pkgs.mkShell {
    buildInputs = [
      nodejs
      yarn
      pkgs.python310
      nodejs.pkgs.node-gyp
    ] ++ nativeBuildDeps;
  };

  scripts = pkgs.buildEnv {
    name = "${pname}-scripts";
    paths = [ buildDocker loadDocker updateCompose ];
  };
}
