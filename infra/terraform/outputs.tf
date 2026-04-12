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
  value       = aws_instance.app_server.public_ip
  description = "EC2 public IPv4 (after instance is running)"
}
