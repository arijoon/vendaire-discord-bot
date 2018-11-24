#!/bin/bash
find . -name \*.png -print | xargs -n 1 bash -c 'convert "$0" "$ {0%.*}.jpg"'
find . -name \*.png -print | xargs -n 1 bash -c 'rm "$0"'

