# ISO 27001 A.13.1.3 / A.9.2.1 / A.10.1.1 — 관리형 PostgreSQL(RDS)
# KO: DB는 private subnet 에만 두고 EC2 app SG 에서만 5432 접근을 허용한다.
# JA: DBはprivate subnetのみに配置し、EC2 app SGからのみ 5432 を許可する。
# EN: DB lives only in private subnets; port 5432 is reachable only from the EC2 app SG.

# ---------- private subnets (RDS subnet group 에는 ≥2 AZ 필요) ----------
resource "aws_subnet" "db_private_a" {
  count                   = var.enable_rds ? 1 : 0
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.11.0/24"
  availability_zone       = "ap-northeast-1a"
  map_public_ip_on_launch = false
  tags                    = { Name = "opus-db-private-a" }
}

resource "aws_subnet" "db_private_c" {
  count                   = var.enable_rds ? 1 : 0
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.12.0/24"
  availability_zone       = "ap-northeast-1c"
  map_public_ip_on_launch = false
  tags                    = { Name = "opus-db-private-c" }
}

resource "aws_db_subnet_group" "opus" {
  count      = var.enable_rds ? 1 : 0
  name       = "opus-db-subnet-group"
  subnet_ids = [aws_subnet.db_private_a[0].id, aws_subnet.db_private_c[0].id]
  tags       = { Name = "opus-db-subnet-group" }
}

# ---------- DB security group (app SG 에서만 5432 허용) ----------
resource "aws_security_group" "db" {
  count = var.enable_rds ? 1 : 0
  name  = "opus-db-sg"
  # KO: description 변경은 SG 전체 교체를 유도해 RDS ENI와 충돌할 수 있어 고정 문구를 유지한다(콘솔 허용은 db_from_console 규칙으로 추가).
  description = "PostgreSQL access restricted to EC2 app SG"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "opus-db-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  count                        = var.enable_rds ? 1 : 0
  security_group_id            = aws_security_group.db[0].id
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  description                  = "PostgreSQL from EC2 app server"
}

resource "aws_vpc_security_group_ingress_rule" "db_from_console" {
  count                        = var.enable_rds ? 1 : 0
  security_group_id            = aws_security_group.db[0].id
  referenced_security_group_id = aws_security_group.console.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  description                  = "PostgreSQL from EC2 console server"
}

# DB 는 외부 네트워크를 호출할 필요가 없으므로 egress 도 최소화 (VPC 내부 only)
resource "aws_vpc_security_group_egress_rule" "db_egress_vpc" {
  count             = var.enable_rds ? 1 : 0
  security_group_id = aws_security_group.db[0].id
  cidr_ipv4         = aws_vpc.main.cidr_block
  ip_protocol       = "-1"
  description       = "Stay within VPC (no outbound internet)"
}

# ---------- master password ----------
# state 파일에만 저장(gitignore). AWS 콘솔/출력에는 sensitive 플래그로 노출 최소화.
resource "random_password" "db_master" {
  count            = var.enable_rds ? 1 : 0
  length           = 32
  special          = true
  override_special = "!#$%^&*()-_=+[]{}"
}

# ---------- RDS instance ----------
resource "aws_db_instance" "opus" {
  count                        = var.enable_rds ? 1 : 0
  identifier                   = "opus-dev-postgres"
  engine                       = "postgres"
  engine_version               = var.db_engine_version
  instance_class               = var.db_instance_class
  allocated_storage            = var.db_allocated_storage
  storage_type                 = "gp3"
  storage_encrypted            = true
  db_name                      = var.db_name
  username                     = var.db_username
  password                     = random_password.db_master[0].result
  db_subnet_group_name         = aws_db_subnet_group.opus[0].name
  vpc_security_group_ids       = [aws_security_group.db[0].id]
  publicly_accessible          = false
  multi_az                     = false
  backup_retention_period      = 1
  delete_automated_backups     = true
  skip_final_snapshot          = true
  deletion_protection          = false
  auto_minor_version_upgrade   = true
  apply_immediately            = true
  performance_insights_enabled = false

  tags = { Name = "opus-dev-postgres" }
}
