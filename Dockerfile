FROM resin/raspberry-pi-alpine:latest

RUN apk add --update make g++ gcc python ffmpeg autoconf libtool nodejs git automake
RUN apk add --update imagemagick jpegoptim yarn cairo-dev pango-dev jpeg-dev giflib-dev freetype-dev libjpeg-turbo-dev
RUN apk add --update npm && npm install -g node-gyp


WORKDIR /app
COPY package*.json yarn.lock ./

RUN yarn install
COPY . .
RUN npm run compile:fromclean

CMD ["node","build/bootstrap.js"]

