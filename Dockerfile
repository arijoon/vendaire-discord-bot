FROM nodejs-base

RUN apk add --update git automake

WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .
RUN npm run compile

CMD ["node","build/cluster.js"]

