# OPUS — Terraform (AWS)

VPC, EC2(앱 서버), **옵션 RDS(PostgreSQL)** 를 한 스택으로 올립니다. 리전 기본값은 `ap-northeast-1` 입니다.

## 사전 준비

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5
- AWS 자격 증명(`aws configure` 또는 환경 변수) — 이 스택을 띄울 계정·권한
- OpenSSH **공개키** 한 줄(비밀키는 저장소·Terraform에 넣지 않음)

## 초기 설정

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars 편집: ssh_public_key, (선택) enable_rds = true
terraform init
terraform plan
terraform apply
```

`terraform.tfvars`와 `*.tfstate`는 `.gitignore`에 포함되어 있습니다. **state에 RDS 비밀번호가 들어가므로** 공유·운영 전에는 S3 등 **원격 백엔드**로 옮기는 것을 권장합니다(`provider.tf` 주석 참고).

## RDS 켜기

`terraform.tfvars`에서:

```hcl
enable_rds = true
```

- DB는 **퍼블릭 접속 불가**(`publicly_accessible = false`), **앱 EC2 보안 그룹에서만** 5432 허용입니다(`rds.tf`).
- 마스터 비밀번호는 `random_password`로 생성되며 **state에만** 보관됩니다.

## 앱용 `DATABASE_URL` (Prisma / Next.js)

적용 후( `enable_rds = true` 일 때):

```bash
# 저장소 루트에서
terraform -chdir=infra/terraform output -raw rds_database_url
```

출력은 `sensitive`이며 비밀번호는 URL 인코딩되어 있습니다. 이 값을 배포 플랫폼의 **서버 전용** 환경 변수 `DATABASE_URL`로 넣습니다(`NEXT_PUBLIC_` 접두사 금지).

로컬에서 Prisma 마이그레이션만 적용할 때:

```bash
cd apps/web
DATABASE_URL="$(terraform -chdir=../../infra/terraform output -raw rds_database_url)" pnpm exec prisma migrate deploy
```

(경로는 clone 위치에 맞게 조정하세요.)

## 기타 출력

| 출력 | 설명 |
|------|------|
| `instance_public_ip` | EC2 퍼블릭 IPv4 |
| `rds_endpoint` / `rds_port` | RDS 호스트명·포트 |
| `rds_username` / `rds_db_name` | 연결에 필요한 메타 |
| `rds_password` | `-raw` 로만 조회; 가능하면 앱에는 `rds_database_url` 한 줄만 사용 |

## 운영·보안 메모

- 프로덕션에서는 `SECURITY_GOVERNANCE.md`에 맞춰 비밀은 **GCP/AWS Secret Manager** 등으로 이전하고, Terraform output은 초기 부트스트랩에만 쓰는 패턴이 안전합니다.
- EC2 SSH(22)·HTTP(80)·HTTPS(443)는 현재 `0.0.0.0/0` 입니다. 운영 시 관리 IP·Tailscale 등으로 좁히는 것을 검토하세요.

## 듀얼 라이트(선택)

앱에서 JSONL 발행 후 Prisma에도 쓰려면 `OPUS_PRISMA_CHRONICLE_DUAL_WRITE=1` 을 같은 배포 환경에 추가합니다. `DATABASE_URL` 이 먼저 유효해야 합니다.
