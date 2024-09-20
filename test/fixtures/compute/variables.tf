# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

variable "instance_name" {
  type        = string
  description = "Name of the compute instance"
}

variable "machine_type" {
  type    = string
  default = "f1-micro"
}
