#!/usr/bin/env bash
# Run once on a fresh Ubuntu EC2 (e.g. after Terraform replace) before ec2-pull-restart.sh.
# KO: Docker 미설치 호스트에서 공식 스크립트로 엔진을 깔고 배포 사용자를 docker 그룹에 넣는다.
# JA: Docker未導入のホストに公式スクリプトでエンジンを入れ、デプロイユーザをdockerグループへ追加する。
# EN: Install Docker via get.docker.com and add the deploy user to the docker group on a bare host.
set -euo pipefail

if command -v docker >/dev/null 2>&1; then
  echo "[ec2-ensure-docker] docker already installed"
else
  curl -fsSL https://get.docker.com | sudo sh
fi

sudo usermod -aG docker "$(whoami)" || true
echo "[ec2-ensure-docker] done — open a new SSH session (or re-login) then run ec2-pull-restart.sh"
