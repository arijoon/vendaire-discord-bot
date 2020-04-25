FROM resin/raspberry-pi-alpine:latest

RUN apk add --update make g++ gcc python ffmpeg autoconf libtool nodejs git automake nodejs-npm
RUN apk add --update imagemagick jpegoptim

WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .
RUN npm run compile:fromclean

CMD ["node","build/bootstrap.js"]

