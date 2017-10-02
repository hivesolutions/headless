FROM hivesolutions/alpine_dev:latest
MAINTAINER Hive Solutions

EXPOSE 8080

ENV HOST 0.0.0.0
ENV PORT 8080
ENV NODE_ENV production

ADD app.js /
ADD package.json /

RUN apk update && apk add nodejs nodejs-npm
RUN npm install

CMD ["/usr/bin/node", "/app.js"]
