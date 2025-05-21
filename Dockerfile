FROM node:18

# updates package list, installs the nc command (nc command is used to allow network connections, in this case sql) rm -rf removes the unnessisary cached files
RUN apt-get update \
 && apt-get install -y netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

 # This basically does cd /app
WORKDIR /app

#installs and copies accross things
COPY package*.json ./
RUN npm install

# Copy wait-fpr-it and marks it as exacutable
COPY wait-for-it.sh /usr/local/bin/wait-for-it
RUN chmod +x /usr/local/bin/wait-for-it

# Copy files accross
COPY . .

EXPOSE 3000

# This tells docker to wait for the mysql before running the app
CMD ["wait-for-it", "mysql:3306", "--", "node", "server.js"]
