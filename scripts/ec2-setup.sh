#!/bin/bash
# Installation de Docker + Compose sur l'EC2 (Amazon Linux 2023).
# Usage : coller dans « User data » au lancement de l'EC2, ou lancer : sudo bash ec2-setup.sh
set -euo pipefail

dnf install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user

# Plugins Docker Compose et Buildx (absents du paquet docker d'Amazon Linux)
mkdir -p /usr/local/lib/docker/cli-plugins
ARCH=$(uname -m)                                   # x86_64 ou aarch64
BUILDX_ARCH=$([ "$ARCH" = "x86_64" ] && echo amd64 || echo arm64)

curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-${ARCH}" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
curl -fsSL "https://github.com/docker/buildx/releases/download/v0.17.1/buildx-v0.17.1.linux-${BUILDX_ARCH}" \
  -o /usr/local/lib/docker/cli-plugins/docker-buildx
chmod +x /usr/local/lib/docker/cli-plugins/*

docker compose version
echo "OK — reconnectez-vous (ou 'newgrp docker') pour utiliser docker sans sudo."
