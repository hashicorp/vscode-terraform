# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

component "s3" {
  source = "./s3"

  inputs = {
    region = var.region
  }

  providers = {
    aws    = provider.aws.this
    random = provider.random.this
  }
}

component "lambda" {
  source = "./lambda"

  inputs = {
    region    = var.region
    bucket_id = component.s3.bucket_id
  }

  providers = {
    aws     = provider.aws.this
    archive = provider.archive.this
    local   = provider.local.this
    random  = provider.random.this
  }
}

component "api_gateway" {
  source = "./api-gateway"

  inputs = {
    region               = var.region
    lambda_function_name = component.lambda.function_name
    lambda_invoke_arn    = component.lambda.invoke_arn
  }

  providers = {
    aws    = provider.aws.this
    random = provider.random.this
  }
}
