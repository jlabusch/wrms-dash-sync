FROM node:lts-buster

WORKDIR /opt

COPY package.json /opt/

RUN npm install

COPY . /opt/

ENTRYPOINT ["npm"]
