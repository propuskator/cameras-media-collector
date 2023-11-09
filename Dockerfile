FROM node:14.17.3-alpine AS BUILDER

ENV WORKDIR_PATH /app

WORKDIR ${WORKDIR_PATH}

COPY package-lock.json package.json ./
RUN npm ci --only=production

COPY start.sh start.sh
RUN chmod +x start.sh

FROM node:14.17.3-alpine

RUN apk update && apk add --no-cache \
    ffmpeg \
    tzdata

ENV WORKDIR_PATH /app

WORKDIR ${WORKDIR_PATH}

COPY --from=BUILDER ${WORKDIR_PATH}/ .
COPY index.js index.js
COPY app.js app.js
COPY config/ config/
COPY lib/ lib/

CMD [ "./start.sh" ]
