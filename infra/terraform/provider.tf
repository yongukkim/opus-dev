terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # ISO 27001 A.10.1.1 — tfstate holds DB password material; use remote backend (e.g. S3 + DynamoDB lock) before shared/prod use.
  # KO: 공유·운영 전에는 S3 등 원격 백엔드로 state를 옮긴다(로컬 state 단독 사용 금지 권장).
  # JA: 共有・本番前にS3等のリモートバックエンドへ移行する（ローカルstate単独は非推奨）。
  # EN: Move state to a remote backend before team/prod use; local-only state is discouraged.
}

provider "aws" {
  region = "ap-northeast-1"
}
