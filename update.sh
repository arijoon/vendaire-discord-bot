#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

git pull

nix run -f . loadDocker
docker-compose down
docker-compose up -d
