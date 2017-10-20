 find . -name \*.jpg -print | xargs -n 1 bash -c 'jpegoptim "$0"'
