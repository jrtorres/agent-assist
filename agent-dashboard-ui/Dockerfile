FROM node:20 AS build

WORKDIR /agent-dashboard

COPY src/ src/
COPY *.json *.js ./

RUN npm install --force
RUN npm run build

FROM node:20 AS runtime

USER node

#RUN mkdir -p /agent-dashboard && chown -R node:node /agent-dashboard

WORKDIR /agent-dashboard

COPY --from=build /agent-dashboard/dist ./dist

COPY --from=build /agent-dashboard/node_modules ./node_modules

COPY --from=build /agent-dashboard/package.json ./

EXPOSE 3000

CMD ["node", "--max-old-space-size=4096", "dist/server/index.js"]