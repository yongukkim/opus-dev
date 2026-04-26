# Terraform Bootstrap

This stack creates shared Terraform backend resources:

- S3 bucket for remote `tfstate`
- DynamoDB table for state locking

## Usage

```bash
cd infra/terraform-bootstrap
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars (state_bucket_name must be globally unique)
terraform init
terraform plan
terraform apply
```

After apply, wire the main stack:

```bash
cd ../terraform
cp backend.hcl.example backend.hcl
# set bucket = <state_bucket_name output>
# set dynamodb_table = <lock_table_name output>
terraform init -migrate-state -backend-config=backend.hcl
```
