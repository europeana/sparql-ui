# Select the Node Module
FROM node:23

# Add the working Directory
WORKDIR /app

# COPY the current content to /app folder structure
COPY . /app/

# download all the dependencies from package.json (needed also to run next command, which runs grunt)
RUN npm install

# Run a only_build script from the package.json (grunt build)
RUN npm run only_build

# EXPOSE our port
EXPOSE 8282

# Start the app
ENTRYPOINT ["npm", "run", "start"]