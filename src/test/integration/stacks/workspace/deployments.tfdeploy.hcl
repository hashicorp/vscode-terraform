# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

identity_token "aws" {
  audience = ["<Set to your AWS IAM assume-role audience>"]
}

# A single workload token can be trusted by multiple accounts - but optionally, you can generate a
# separate token with a difference audience value for your second account and use it below.
#
# identity_token "account_2" {
#   audience = ["<Set to your AWS IAM assume-role audience>"]
# }

deployment "development" {
  inputs = {
    region              = "us-east-1"
    role_arn            = "<Set to your development AWS account IAM role ARN>"
    identity_token_file = identity_token.aws.jwt_filename
    default_tags      = { stacks-preview-example = "lambda-multi-account-stack" }
  }
}

deployment "production" {
  inputs = {
    region              = "us-east-1"
    role_arn            = "<Set to your production AWS account IAM role ARN>"
    identity_token_file = identity_token.aws.jwt_filename
    default_tags      = { stacks-preview-example = "lambda-multi-account-stack" }
  }
}
