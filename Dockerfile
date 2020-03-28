FROM node:10
MAINTAINER James D <james@jdrydn.com> (https://jdrydn.com)

# Fetch dumb-init
ADD https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init
# Configure the entrypoint
ENTRYPOINT [ "/usr/local/bin/dumb-init", "--" ]

# Prepare a folder for the Node app to sit at
RUN mkdir -p /var/app && chown node:node /var/app
EXPOSE 3000
WORKDIR /var/app
USER node

# Grab the package.json and install dependencies
COPY --chown=node:node package*.json ./
RUN npm ci --production
# We need a few devDependencies to use ./server.js
RUN npm install --only=dev

# Copy the rest of the files over
COPY --chown=node:node . .
# And set the start command
CMD [ "npm", "start" ]
