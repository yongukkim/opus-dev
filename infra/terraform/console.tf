# OPUS operator console — dedicated minimal EC2 (same VPC as app; shared RDS).
# ISO 27001 A.13.1.3 (§6) — separate ingress host from public storefront; DB remains private RDS.
# KO: 공개 스토어와 운영 콘솔의 공격면을 호스트 단에서 분리한다(DB는 동일 RDS).
# JA: 公開ストアと運用コンソールの攻撃面をホスト単位で分離する（DBは同一RDS）。
# EN: Split storefront vs operator console at the host boundary; database stays one shared RDS.

resource "aws_security_group" "console" {
  name        = "opus-console-sg"
  description = "Operator console EC2 - HTTPS/HTTP/SSH only (ASCII required by AWS API)"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "opus-console-sg" }
}

# ap-northeast-1 arm64(Graviton) + Ubuntu 22.04 조합에서 일반적으로 선택 가능한 최소 버스트블이 t4g.nano.
# 더 작은 타입이 필요하면 리전/AMI를 x86(t3.nano 등)로 바꿔야 하며 앱 서버와 아키텍처가 달라진다.
resource "aws_instance" "console_server" {
  ami                    = data.aws_ami.ubuntu_jammy_arm64.id
  instance_type          = var.console_instance_type # variables.tf 기본값 t4g.nano
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.console.id]
  key_name               = aws_key_pair.opus_key.key_name

  tags = { Name = "opus-console-server" }

  lifecycle {
    ignore_changes = [ami]
  }
}

resource "aws_eip" "console_static_ip" {
  domain   = "vpc"
  instance = aws_instance.console_server.id

  tags = { Name = "opus-console-eip" }
}
