FROM node:18-alpine as builder

WORKDIR /home/node/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine

USER node

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

RUN mkdir -p /home/node/app/server/node_modules && chown -R node:node /home/node/app/server/node_modules

WORKDIR /home/node/app

COPY --from=builder /home/node/app/dist ./dist

COPY --from=builder /home/node/app/landing ./landing

COPY --from=builder /home/node/app/server ./server

WORKDIR /home/node/app/server

RUN npm ci --omit=dev

EXPOSE 3003

# Express server with AppID
#CMD [ "npm", "start" ]

# Express server without AppID
CMD [ "npm", "run", "start-basic" ]
