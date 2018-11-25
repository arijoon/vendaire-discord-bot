FROM nodejs-base

WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .
RUN npm run compile:fromclean

CMD ["node","build/bootstrap.js"]

