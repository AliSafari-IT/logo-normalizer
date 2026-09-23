#!/usr/bin/env bash
#
# Server-side deploy for logo-normalizer (runs ON the VPS).
# Invoked by the GitHub Actions "Deploy to VPS" workflow over SSH, or manually.
#
# Prerequisites already provisioned on the VPS (one-time):
#   - Docker Engine + Compose plugin
#   - repo checked out at  /var/repos/logo-normalizer
#   - container reachable via the shared asafarim-com_asafarim_net network
#     (Caddy proxies asafarim.be/apps/logo-normalizer -> logo-normalizer:3202)
#
set -euo pipefail

REPO_DIR="${REPO_DIR:-/var/repos/logo-normalizer}"
BRANCH="${BRANCH:-main}"
cd "$REPO_DIR"

# Serialized deploys: if a canceled SSH process is still finishing, the next
# deploy waits on the lock instead of racing git/compose operations against it.
DEPLOY_LOCK_FILE="${DEPLOY_LOCK_FILE:-${REPO_DIR}/.vps-deploy.lock}"
exec 9>"${DEPLOY_LOCK_FILE}"
if ! flock -w "${DEPLOY_LOCK_WAIT_SECONDS:-300}" 9; then
  echo "FATAL: another deployment still holds ${DEPLOY_LOCK_FILE}." >&2
  exit 75
fi

echo "[deploy $(date -Is)] Fetching latest ${BRANCH}..."
git fetch --prune origin "$BRANCH"

# GitHub Actions passes the commit whose image it published. Reset to that
# exact revision so the Compose file and the image can never come from
# different commits if main advances during a deployment.
if [[ -n "${IMAGE_TAG:-}" ]]; then
  if ! git cat-file -e "${IMAGE_TAG}^{commit}" 2>/dev/null; then
    echo "FATAL: image commit ${IMAGE_TAG} is not present in the repository." >&2
    exit 1
  fi
  git reset --hard "${IMAGE_TAG}"
else
  git reset --hard "origin/${BRANCH}"
  IMAGE_TAG="$(git rev-parse HEAD)"
fi
export IMAGE_TAG
export IMAGE_REPOSITORY="${IMAGE_REPOSITORY:-ghcr.io/alisafari-it/logo-normalizer}"

# Use the workflow's short-lived GITHUB_TOKEN without persisting it in the
# deploy user's normal Docker configuration. Public GHCR packages also pull
# fine without any login at all.
DEPLOY_DOCKER_CONFIG=""
cleanup_on_exit() {
  if [[ -n "${DEPLOY_DOCKER_CONFIG}" && -d "${DEPLOY_DOCKER_CONFIG}" ]]; then
    rm -f -- "${DEPLOY_DOCKER_CONFIG}/config.json"
    rmdir -- "${DEPLOY_DOCKER_CONFIG}" 2>/dev/null || true
  fi
}
trap cleanup_on_exit EXIT

if [[ -n "${GHCR_TOKEN:-}" ]]; then
  if [[ -z "${GHCR_USERNAME:-}" ]]; then
    echo "FATAL: GHCR_TOKEN was provided without GHCR_USERNAME." >&2
    exit 1
  fi
  DEPLOY_DOCKER_CONFIG="$(mktemp -d)"
  chmod 700 "${DEPLOY_DOCKER_CONFIG}"
  export DOCKER_CONFIG="${DEPLOY_DOCKER_CONFIG}"
  printf '%s' "${GHCR_TOKEN}" | docker login ghcr.io \
    --username "${GHCR_USERNAME}" --password-stdin >/dev/null
  unset GHCR_TOKEN
fi

echo "[deploy $(date -Is)] Pulling ${IMAGE_REPOSITORY}:${IMAGE_TAG}..."
docker compose pull

echo "[deploy $(date -Is)] Starting container..."
# --no-build: never fall back to compiling on the VPS — the image must come
# from GHCR. A missing image is a pipeline failure, not a reason to build.
docker compose up -d --no-build --remove-orphans

# Retain only the currently-running tag; older release tags are one
# `docker pull` away on GHCR if a rollback is ever needed.
mapfile -t STALE_IMAGES < <(
  docker image ls --format '{{.Repository}}:{{.Tag}}' |
    grep -F "${IMAGE_REPOSITORY}:" |
    grep -vF "${IMAGE_REPOSITORY}:${IMAGE_TAG}" || true
)
if (( ${#STALE_IMAGES[@]} > 0 )); then
  echo "[deploy $(date -Is)] Removing superseded image tags..."
  docker image rm "${STALE_IMAGES[@]}" >/dev/null 2>&1 || true
fi
docker image prune -f >/dev/null 2>&1 || true

echo "[deploy $(date -Is)] Verifying https://asafarim.be/apps/logo-normalizer ..."
HTTP_CODE="000"
for _ in $(seq 1 15); do
  HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
    https://asafarim.be/apps/logo-normalizer/ || true)"
  if [[ "${HTTP_CODE}" =~ ^[23] ]]; then
    break
  fi
  sleep 2
done
echo "[deploy $(date -Is)] GET /apps/logo-normalizer -> HTTP ${HTTP_CODE}"
if [[ ! "${HTTP_CODE}" =~ ^[23] ]]; then
  echo "FATAL: site did not return a 2xx/3xx status after deploy." >&2
  docker compose ps
  docker compose logs --tail 40 logo-normalizer || true
  exit 1
fi

echo "[deploy $(date -Is)] Done. Current state:"
docker compose ps
