# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

aws_region          = "ap-southeast-1"
vpc_cidr            = "10.0.0.0/16"
vpc_name            = "MWVPC"
public_subnet_cidrs = "10.0.1.0/24"
private_subnet_cidrs = "10.0.2.0/24"
public_az           = "ap-southeast-1a"
private_az          = "ap-southeast-1a"
ami_id              = "ami-01938df366ac2d954"
instance_type       = "t2.micro"
#instances      =  { web1 = "web", app1 = "app"}
instance_name = "MWVPC-EC2"
