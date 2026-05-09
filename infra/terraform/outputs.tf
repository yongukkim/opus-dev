output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "public_subnet_id" {
  value       = aws_subnet.public.id
  description = "Public subnet ID"
}

output "instance_id" {
  value       = aws_instance.app_server.id
  description = "EC2 instance ID"
}

output "instance_public_ip" {
  value       = aws_eip.app_static_ip.public_ip
  description = "App EC2 public Elastic IP (app.opus-store.com)"
}

output "console_instance_id" {
  value       = aws_instance.console_server.id
  description = "Console-only EC2 instance ID"
}

output "console_public_ip" {
  value       = aws_eip.console_static_ip.public_ip
  description = "Console EC2 Elastic IP — point console.opus-store.com A record here"
}

# ---------- RDS (enable_rds = true 일 때만 값 노출) ----------
output "rds_endpoint" {
  value       = try(aws_db_instance.opus[0].address, null)
  description = "RDS endpoint (hostname, no port)"
}

output "rds_port" {
  value       = try(aws_db_instance.opus[0].port, null)
  description = "RDS port"
}

output "rds_db_name" {
  value       = try(aws_db_instance.opus[0].db_name, null)
  description = "Initial database name inside RDS"
}

output "rds_username" {
  value       = try(aws_db_instance.opus[0].username, null)
  description = "RDS master username"
}

# ISO 27001 A.9.4.3 / A.10.1.1 — secret 출력은 sensitive 로 마스킹.
# KO: 비밀번호는 `terraform output -raw rds_password` 로만 꺼내 쓴다.
# JA: パスワードは `terraform output -raw rds_password` でのみ取り出す。
# EN: Retrieve the password only via `terraform output -raw rds_password`.
output "rds_password" {
  value       = try(random_password.db_master[0].result, null)
  description = "RDS master password (sensitive; kept in tfstate)"
  sensitive   = true
}

# DATABASE_URL 은 password 를 URL-encode 해서 특수문자(예: % ! = [ ]) 로
# 깨지지 않게 한다. libpq 와 Prisma 는 모두 이 규약을 따른다.
output "rds_database_url" {
  value = try(
    format(
      "postgresql://%s:%s@%s:%d/%s?sslmode=require",
      aws_db_instance.opus[0].username,
      urlencode(random_password.db_master[0].result),
      aws_db_instance.opus[0].address,
      aws_db_instance.opus[0].port,
      aws_db_instance.opus[0].db_name,
    ),
    null,
  )
  description = "Full DATABASE_URL for application env (sensitive, url-encoded password)"
  sensitive   = true
}
