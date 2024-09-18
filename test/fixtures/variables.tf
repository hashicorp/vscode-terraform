# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

variable "project" {
  type = string
}

variable "credentials_file" {
  type = string
}

variable "region" {
  default = "us-central1"
}

variable "zone" {
  default = "us-central1-c"
}
