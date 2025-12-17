FROM node:18-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --legacy-peer-deps --ignore-scripts || npm install --force --ignore-scripts

COPY . .

RUN mkdir -p /app/data

EXPOSE 9012

CMD ["node", "server.js"]
