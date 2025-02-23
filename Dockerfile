# Select the Node Module
FROM node:23

# Add the working Directory
WORKDIR /app

# COPY the current content to /app folder structure
COPY . /app/

# download all the dependencies from package.json (needed also to run next command, which runs grunt)
RUN npm install

# Run a build script from the package.json (grunt build)
RUN npm run build

# run 2. time is needed because the previous command modifies some npm dependencies (please see Gruntfile.js)
RUN npm install

# EXPOSE our port
EXPOSE 8282

# Start the app
ENTRYPOINT ["npm", "run", "start"]