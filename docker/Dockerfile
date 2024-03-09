FROM node:20

RUN mkdir /home/node/app \
 && chown node:node /home/node/app
USER node
WORKDIR /home/node/app

COPY --chown=node:node package.json package-lock.json ./
RUN npm install
RUN npm i -D @sveltejs/adapter-node@1.3.1

COPY --chown=node:node . ./

COPY --chown=node:node docker/docker-entrypoint.sh /

RUN sed -i 's/adapter-auto/adapter-node/' svelte.config.js

RUN npx prisma generate

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "build"]
EXPOSE 3000/tcp

HEALTHCHECK --interval=15s --timeout=3s --start-period=25s --retries=2 \
  CMD curl -f http://localhost:3000/privacy || exit 1
