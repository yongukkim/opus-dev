# ISO 27001 A.9.4.2: SSH는 AWS에 등록한 공개키와 로컬 사설키 페어로만 접속한다.
# KO: 공개키만 EC2 키 페어로 올리고, 사설키는 저장소·AWS에 넣지 않는다.
# JA: 公開鍵のみを登録し、秘密鍵はリポジトリやAWSに置かない。
# EN: Only the public key is uploaded; never commit or upload the private key.

variable "ssh_public_key" {
  type        = string
  description = "OpenSSH public key line (e.g. from ~/.ssh/id_rsa.pub). Set in terraform.tfvars (gitignored)."
  sensitive   = true
}

# KO: 웹/WAS 호스트 — Docker 빌드·Next 런타임에 t4g.micro 보다 여유 RAM이 필요하면 한 단계 올린다.
# JA: Web/WAS ホスト — Docker/Next のため RAM に余裕が必要なら一段上げる。
# EN: Web/WAS host; bump one size when Docker/Next needs more RAM than t4g.micro.
variable "app_instance_type" {
  type        = string
  description = "EC2 instance type for the OPUS app server (arm64 Graviton, e.g. t4g.small)."
  default     = "t4g.small"
}

# KO: 운영 콘솔 전용 호스트 — 스토어 EC2와 분리; RDS는 동일 VPC에서 SG로만 접근.
# JA: 運用コンソール専用ホスト — ストアEC2と分離。RDSは同一VPC内でSG経由のみ。
# EN: Dedicated operator-console host (split from storefront EC2); same RDS over VPC SG rules.
variable "console_instance_type" {
  type        = string
  description = "EC2 instance type for the OPUS console server only (arm64 Graviton, e.g. t4g.nano)."
  default     = "t4g.nano"
}

# ISO 27001 A.13.1.3 / A.10.1.1: RDS 네트워크·암호화 경계를 변수로 노출해
# 환경(개발/스테이징) 단위로 독립 관리한다.
# KO: RDS 활성/비활성과 규모는 tfvars 에서만 토글해 실수로 프로덕션 크기를 띄우지 않는다.
# JA: RDS の有効化・規模は tfvars でのみ切替し、誤って本番規模を起動しない。
# EN: RDS toggles/sizing are driven only by tfvars to prevent accidental prod scale.
variable "enable_rds" {
  type        = bool
  description = "Create a managed PostgreSQL RDS instance for this stack."
  default     = false
}

variable "db_name" {
  type        = string
  description = "Initial database name created inside the RDS instance."
  default     = "opus"
}

variable "db_username" {
  type        = string
  description = "Master username for the RDS instance (password is randomly generated)."
  default     = "opus"
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance class (free-tier eligible: db.t4g.micro in ap-northeast-1)."
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  type        = number
  description = "Allocated storage in GiB (gp3)."
  default     = 20
}

variable "db_engine_version" {
  type        = string
  description = "PostgreSQL engine version (ap-northeast-1 available list may shift; pin latest patch)."
  default     = "16.13"
}
