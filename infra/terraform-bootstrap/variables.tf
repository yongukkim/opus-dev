variable "aws_region" {
  type        = string
  description = "AWS region for bootstrap resources."
  default     = "ap-northeast-1"
}

variable "state_bucket_name" {
  type        = string
  description = "Globally unique S3 bucket for Terraform remote state."
}

variable "lock_table_name" {
  type        = string
  description = "DynamoDB table name for Terraform state lock."
  default     = "opus-terraform-locks"
}
