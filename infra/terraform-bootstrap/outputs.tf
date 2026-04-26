output "state_bucket_name" {
  description = "Terraform remote state bucket."
  value       = aws_s3_bucket.tf_state.id
}

output "lock_table_name" {
  description = "Terraform state lock DynamoDB table."
  value       = aws_dynamodb_table.tf_lock.name
}
