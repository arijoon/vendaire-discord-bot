{ sources ? import ./nix/sources.nix }:
let
  pkgs = import sources.nixpkgs {
    overlays = [ ];
    config = {
      allowUnfree = true;
    };
  };

  nodejs = pkgs.nodejs-18_x;
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

in
{
  inherit deps pkgs;

  shell = pkgs.mkShell {
    buildInputs = [
    ] ++ deps;

    shellHook = ''
    '';
  };
}
