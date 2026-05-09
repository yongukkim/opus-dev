# OPUS — Terraform (AWS)

VPC, EC2(앱 서버), **운영 콘솔 전용 EC2(최소 사양)**, **옵션 RDS(PostgreSQL)** 를 한 스택으로 올립니다. 앱·콘솔은 호스트를 나누고 **DB(RDS)는 동일**하게 쓰도록 설계했습니다. 리전 기본값은 `ap-northeast-1` 입니다.

## 사전 준비

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5
- AWS 자격 증명(`aws configure` 또는 환경 변수) — 이 스택을 띄울 계정·권한
- OpenSSH **공개키** 한 줄(비밀키는 저장소·Terraform에 넣지 않음)

## 원격 state (S3) — 권장

`infra/terraform-bootstrap` 스택으로 S3/DynamoDB를 먼저 만든 뒤, 이 스택에서 backend를 연결하세요.

```bash
cd infra/terraform-bootstrap
cp terraform.tfvars.example terraform.tfvars
terraform init && terraform apply
```

`provider.tf`에 `backend "s3" {}` 가 있어 **첫 `terraform init`부터** `backend.hcl` 이 필요합니다.

1. **버킷 생성**(전역 유일 이름) + 버전 관리 권장 — `backend.hcl.example` 상단 주석에 AWS CLI 예시가 있습니다.
2. (선택) **DynamoDB** 잠금 테이블 생성 후 `backend.hcl` 의 `dynamodb_table` 주석 해제.
3. 로컬 파일 생성:

```bash
cd infra/terraform
cp backend.hcl.example backend.hcl
# backend.hcl 편집: bucket, (선택) dynamodb_table
terraform init -backend-config=backend.hcl
```

이미 **로컬 `terraform.tfstate`** 로 쓰던 경우, 같은 명령에 **이전** 옵션을 붙입니다:

```bash
terraform init -migrate-state -backend-config=backend.hcl
```

`backend.hcl` 은 `.gitignore`에 포함되어 커밋되지 않습니다.

## 초기 설정 (리소스)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars 편집: ssh_public_key, (선택) enable_rds = true
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```

`terraform.tfvars`와 `*.tfstate`는 `.gitignore`에 포함되어 있습니다. **state에 RDS 비밀번호가 들어가므로** S3 백엔드 + 버킷 암호화·IAM 최소 권한을 유지하세요.

앱 EC2 타입은 변수 **`app_instance_type`**(기본 `t4g.small`)로, 콘솔 전용 EC2는 **`console_instance_type`**(기본 `t4g.nano`)로 조절합니다. `terraform apply` 시 타입이 바뀌면 인스턴스가 **교체**될 수 있고 **퍼블릭 IP가 바뀔 수** 있습니다(앱·콘솔 각각 **Elastic IP**에 고정됩니다).

## apply 전 확인 — 스토어 EC2는 유지하고 콘솔만 추가할 때

의도가 **「기존 스토어 VM은 손대지 않고 `opus-console-server`만 만든다」** 라면, **`terraform plan` 결과를 반드시 읽은 뒤** apply 하세요.

- **정상(의도에 맞음):** `aws_instance.console_server`, `aws_eip.console_static_ip`, `aws_security_group.console`, RDS 관련 `db_from_console` 등 **콘솔·규칙 추가(+)만** 보이는 경우.
- **위험:** `aws_instance.app_server`에 **`must be replaced` / `-/+`** 가 보이는 경우 — 이때 apply 하면 **스토어용 인스턴스가 새 VM으로 바뀌고**, 예전 인스턴스는 **중지·삭제**될 수 있습니다. **적용을 중단**하고, 레포의 `main.tf`에 **`lifecycle { ignore_changes = [ami] }`**(앱 인스턴스)가 있는지 확인하세요.
- 스토어의 **북마크용 공인 주소**는 인스턴스의 임시 퍼블릭 IP가 아니라 **`aws_eip.app_static_ip`에 연결된 Elastic IP**입니다. `terraform output -raw instance_public_ip` 가 Route53 **`app.opus-store.com`** 과 일치하는지 보세요.

## 콘솔 호스트·DNS

- `terraform output -raw console_public_ip` 값으로 DNS **`console.opus-store.com` A 레코드**를 맞춥니다(앱과 **다른 IP**여야 정상 분리입니다).
- GitHub Actions 콘솔 배포(`.github/workflows/build-console-image.yml`)는 저장소 시크릿 **`CONSOLE_EC2_HOST`** 에 그 **Elastic IP(또는 고정 호스트명)** 를 넣어야 합니다. 앱 서버용 **`EC2_HOST`** 와 별도입니다.
- 콘솔 EC2에도 앱과 **동일한** `/etc/opus/opus.env`(특히 `DATABASE_URL`)를 두면 RDS를 공유합니다.

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
| `instance_id` | 앱 EC2 인스턴스 ID |
| `instance_public_ip` | 앱 EC2 Elastic IP (`app.opus-store.com`) |
| `console_public_ip` | 콘솔 EC2 Elastic IP (`console.opus-store.com` A 레코드) |
| `console_instance_id` | 콘솔 EC2 인스턴스 ID |
| `rds_endpoint` / `rds_port` | RDS 호스트명·포트 |
| `rds_username` / `rds_db_name` | 연결에 필요한 메타 |
| `rds_password` | `-raw` 로만 조회; 가능하면 앱에는 `rds_database_url` 한 줄만 사용 |

## 운영·보안 메모

- GitHub Actions: 스토어 배포는 **`secrets.EC2_HOST`** (`terraform output -raw instance_public_ip`), 콘솔 배포·Caddy reload는 **`secrets.CONSOLE_EC2_HOST`** (`terraform output -raw console_public_ip`)를 맞춥니다. 로컬에서는 `scripts/write-ec2-env.sh`가 앱 호스트 출력을 기본으로 사용합니다.
- 프로덕션에서는 `SECURITY_GOVERNANCE.md`에 맞춰 비밀은 **GCP/AWS Secret Manager** 등으로 이전하고, Terraform output은 초기 부트스트랩에만 쓰는 패턴이 안전합니다.
- EC2 SSH(22)·HTTP(80)·HTTPS(443)는 현재 `0.0.0.0/0` 입니다. 운영 시 관리 IP·Tailscale 등으로 좁히는 것을 검토하세요.

## 듀얼 라이트(선택)

앱에서 JSONL 발행 후 Prisma에도 쓰려면 `OPUS_PRISMA_CHRONICLE_DUAL_WRITE=1` 을 같은 배포 환경에 추가합니다. `DATABASE_URL` 이 먼저 유효해야 합니다.
