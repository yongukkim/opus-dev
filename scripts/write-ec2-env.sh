#!/usr/bin/env bash
# 로컬(맥북)에서 실행해 Terraform output 의 DATABASE_URL 등을
# EC2 의 /etc/opus/opus.env 로 안전하게 배포한다. 값은 화면에 프린트되지 않는다.
#
# ISO 27001 A.9.4.1 / A.10.1.1:
#   KO: 비밀은 이미지/리포에 넣지 않고 런타임 호스트 파일로만 주입한다.
#   JA: シークレットはイメージ/リポに埋め込まず、ホスト上の設定ファイルでのみ供給する。
#   EN: Secrets live only on the host as runtime env file, never in images/repo.
set -euo pipefail

SSH_KEY="${SSH_KEY:-$HOME/.ssh/opus_ci_deploy}"
EC2_HOST="${EC2_HOST:-13.114.20.122}"
EC2_USER="${EC2_USER:-ubuntu}"
ENV_PATH="${ENV_PATH:-/etc/opus/opus.env}"
TF_DIR="${TF_DIR:-$(cd "$(dirname "$0")/.." && pwd)/infra/terraform}"

cd "$TF_DIR"

DATABASE_URL="$(terraform output -raw rds_database_url)"
RDS_HOST="$(terraform output -raw rds_endpoint)"
RDS_USER="$(terraform output -raw rds_username)"
RDS_DB="$(terraform output -raw rds_db_name)"
RDS_PORT="$(terraform output -raw rds_port)"

if [[ -z "$DATABASE_URL" ]]; then
  echo "ERROR: DATABASE_URL 가 비었습니다. terraform apply 가 끝났는지 확인하세요." >&2
  exit 1
fi

echo "==> EC2 에 /etc/opus 디렉터리 보장 + 0750"
ssh -i "$SSH_KEY" -o BatchMode=yes "${EC2_USER}@${EC2_HOST}" \
  "sudo install -d -m 0750 -o root -g ${EC2_USER} /etc/opus"

echo "==> ${ENV_PATH} 쓰기 (0640, 소유: root:${EC2_USER})"
ssh -i "$SSH_KEY" -o BatchMode=yes "${EC2_USER}@${EC2_HOST}" \
  "sudo install -m 0640 -o root -g ${EC2_USER} /dev/null ${ENV_PATH} && sudo tee ${ENV_PATH} >/dev/null" <<EOF
# Managed by scripts/write-ec2-env.sh — do not edit by hand.
DATABASE_URL=${DATABASE_URL}
DB_HOST=${RDS_HOST}
DB_PORT=${RDS_PORT}
DB_NAME=${RDS_DB}
DB_USER=${RDS_USER}
EOF

echo "==> 파일 권한·길이 확인 (값은 찍지 않음)"
ssh -i "$SSH_KEY" -o BatchMode=yes "${EC2_USER}@${EC2_HOST}" \
  "ls -la ${ENV_PATH} && wc -l ${ENV_PATH} && sudo grep -c '^DATABASE_URL=' ${ENV_PATH}"

echo "==> 완료. compose 재기동 시 env_file: ${ENV_PATH} 로 주입됩니다."
