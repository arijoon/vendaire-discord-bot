FROM nodejs-base

WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .
RUN npm run compile

CMD ["node","build/cluster.js"]

