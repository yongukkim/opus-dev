# Canonical Ubuntu 22.04 LTS arm64 (t4g) — ap-northeast-1에서 항상 존재하는 최신 AMI
data "aws_ami" "ubuntu_jammy_arm64" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-arm64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# VPC 생성
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags       = { Name = "opus-vpc" }
}

# 퍼블릭 인터넷 연결 (스니펫에 없지만 퍼블릭 IP·패키지 설치에 필요)
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "opus-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "opus-public-rt" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

# 서브넷 생성
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-northeast-1a"
  map_public_ip_on_launch = true
  tags                    = { Name = "opus-public-subnet" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# 외부 SSH/HTTP (스니펫에 없으면 VPC 기본 SG로는 인터넷에서 접속 불가)
resource "aws_security_group" "app" {
  name   = "opus-app-sg"
  vpc_id = aws_vpc.main.id

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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "opus-app-sg" }
}

# 맥북(로컬) 공개키를 AWS에 등록 — 사설키는 이 파일에 넣지 말 것
resource "aws_key_pair" "opus_key" {
  key_name   = "opus-deploy-key"
  public_key = var.ssh_public_key
}

resource "aws_instance" "app_server" {
  ami                    = data.aws_ami.ubuntu_jammy_arm64.id
  instance_type          = "t4g.micro"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  key_name               = aws_key_pair.opus_key.key_name

  tags = { Name = "opus-dev-server" }
}
