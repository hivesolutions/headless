FROM hivesolutions/ubuntu_dev:latest
MAINTAINER Hive Solutions

EXPOSE 8080

ENV HOST 0.0.0.0
ENV PORT 8080
ENV NODE_ENV production

ADD app.js /
ADD package.json /

RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get update && apt-get install -y nodejs
RUN npm install

CMD ["/usr/bin/node", "/app.js"]
