FROM hivesolutions/alpine_dev:latest
MAINTAINER Hive Solutions

EXPOSE 3000

ENV NODE_ENV production

ADD app.js /
ADD package.json /

RUN apk update && apk add nodejs nodejs-npm
RUN npm install

CMD ["/usr/bin/node", "/app.js"]
