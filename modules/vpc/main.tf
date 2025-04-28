# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  # Should be enabled when using public subnets, especially if you want to SSH via DNS or register services via DNS.
  enable_dns_support   = true # if "false" DNS is completely disabled inside the VPC.
  enable_dns_hostnames = true # if false EC2 instances do not get DNS hostnames, only IPs.

  tags = {
    Name = var.vpc_name
  }
}
# Public Subnets
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs
  availability_zone       = var.public_az
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.vpc_name}-Public-Subnet"
  }
}
# Private Subnets
resource "aws_subnet" "private_subnet" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_subnet_cidrs
  availability_zone       = var.private_az
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.vpc_name}-Private-Subnet"
  }
}

#Internet Gateway (IGW) Associate IGW with VPC
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id # Attach to dynamically created VPC

  tags = {
    Name = "${var.vpc_name}-IGW"
  }
}
#######################################
# Create Public Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id # Attach to dynamically created VPC
  tags = {
    Name = "${var.vpc_name}-Public-RT"
  }
  #Route provide internet access to public subnet
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id # Associate with IGW
  }
}
  # Associate Public Subnet(s) with Public Route Table
  resource "aws_route_table_association" "public_rt_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}
##########################################

# Create Private Route Table, we don't need to provide an internet route to private subnets
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main.id # Attach to dynamically created VPC
  tags = {
    Name = "${var.vpc_name}-Private-RT"
  }
  #Route provide internet access to Private subnet
  /*route {
    cidr_block = "0.0.0.0/0"
    gateway_id = NATGATEWAY-ID # Associate with NATGATEWAY
  }*/
}
# Associate Private Subnet(s) with Private Route Table
resource "aws_route_table_association" "private_rt_assoc" {
  subnet_id      = aws_subnet.private_subnet.id
  route_table_id = aws_route_table.private_rt.id
}
############################################
