FROM alpine:3.16.2

RUN apk update
RUN apk add --update make g++ gcc python3 py3-pip ffmpeg autoconf libtool nodejs git automake
RUN apk add --update imagemagick jpegoptim yarn cairo-dev pango-dev jpeg-dev giflib-dev freetype-dev libjpeg-turbo-dev
RUN apk add --update npm && npm install -g node-gyp

# Install Python dependencies
RUN pip3 install gallery-dl

WORKDIR /app
COPY package*.json yarn.lock ./

RUN yarn install
COPY gallery-dl.conf /root/.gallery-dl.conf
ARG EXTRA_PATH
ENV PATH ${EXTRA_PATH}:${PATH}
COPY . .
RUN npm run compile:fromclean

CMD ["node","build/bootstrap.js"]

