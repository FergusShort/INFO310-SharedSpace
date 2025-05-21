#!/usr/bin/env bash

#   Exit if error
set -e

#   HostPort Gets first input of command line (The port) then CMD gets the rest
HOSTPORT="$1"
shift
CMD="$@"

#   If not enough arguments then print error
if [[ -z "$HOSTPORT" || -z "$CMD" ]]; then
  echo "Usage: $0 host:port -- command"
  exit 1
fi

#   For mysql:3306 its says HOST (Mysql) is before the : and 3306 (Port) is after the :
HOST="${HOSTPORT%%:*}"
PORT="${HOSTPORT##*:}"

# Wait for the port to be available meaning mysql is live/ready to be used
echo "Waiting for $HOST:$PORT..."
while ! nc -z "$HOST" "$PORT"; do
  sleep 1
done

echo "$HOST:$PORT is available — executing command"
exec $CMD
