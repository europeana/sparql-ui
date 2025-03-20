# Select the Node Module
FROM node:23.10-alpine3.21

# Add the working Directory
WORKDIR /app

# COPY the current content to /app folder structure
COPY ./build/ /app/
COPY package.json /app/
COPY ./europeana /app/europeana
COPY ./node_modules /app/node_modules

# EXPOSE our port
EXPOSE 8282

# Start the app
ENTRYPOINT ["npm", "run", "start"]