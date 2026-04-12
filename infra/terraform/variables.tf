# ISO 27001 A.9.4.2: SSH는 AWS에 등록한 공개키와 로컬 사설키 페어로만 접속한다.
# KO: 공개키만 EC2 키 페어로 올리고, 사설키는 저장소·AWS에 넣지 않는다.
# JA: 公開鍵のみを登録し、秘密鍵はリポジトリやAWSに置かない。
# EN: Only the public key is uploaded; never commit or upload the private key.

variable "ssh_public_key" {
  type        = string
  description = "OpenSSH public key line (e.g. from ~/.ssh/id_rsa.pub). Set in terraform.tfvars (gitignored)."
  sensitive   = true
}
