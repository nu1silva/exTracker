#!/usr/bin/env bash
# Usage: docker/run.sh [up|down|reset|logs]
#   up     build and start (data persists in the extracker-data volume)
#   down   stop and remove containers, keep data
#   reset  stop and also delete the database volume
#   logs   follow the web container's log
# Uses plain `docker` (no compose needed).
set -euo pipefail
cd "$(dirname "$0")/.."

NET=extracker-net
VOLUME=extracker-data
PORT="${EXTRACKER_PORT:-8080}"

down() {
  # -v drops anonymous volumes only; the named data volume survives
  docker rm -fv extracker-web extracker-db >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
}

case "${1:-up}" in
  up)
    down
    docker network create "$NET" >/dev/null
    docker build -q -t extracker-web docker >/dev/null

    docker run -d --name extracker-db --network "$NET" --network-alias db \
      -e MARIADB_ROOT_PASSWORD=root \
      -v "$VOLUME:/var/lib/mysql" \
      -v "$PWD/dbscripts/exTracker_mysql.sql:/docker-entrypoint-initdb.d/schema.sql:ro" \
      mariadb:10.6 >/dev/null

    docker run -d --name extracker-web --network "$NET" -p "$PORT:80" \
      -e DB_HOST=db -e DB_USER=root -e DB_PASSWORD=root -e DB_NAME=xtracker \
      -v "$PWD:/var/www/html:ro" \
      extracker-web >/dev/null

    echo "exTracker: http://localhost:$PORT/login.php  (admin / admin)"
    echo "DB may take ~10s to initialise on first start."
    ;;
  down)
    down
    ;;
  reset)
    down
    docker volume rm "$VOLUME" >/dev/null 2>&1 || true
    ;;
  logs)
    docker logs -f extracker-web
    ;;
  *)
    echo "usage: $0 [up|down|reset|logs]" >&2; exit 1
    ;;
esac
