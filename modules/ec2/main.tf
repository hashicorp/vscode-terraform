# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

# EC2 Instance
/*variable "instance_name" {
   type = string
   default = "MWVPC-EC2"
}*/
# Public Security Group for public EC2
resource "aws_security_group" "public_sg" {
  name        = "${var.vpc_name}-Public-SG"
  description = "Allow SSH access"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Open to all; restrict this for security in production
  }
  ingress {
    description = "Allow ICMP (Ping)"
    from_port   = -1
    to_port     = -1
    protocol    = "icmp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "${var.vpc_name}-Public-SG"
  }
}
resource "aws_instance" "webserver" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  #key_name               = var.key_name
  key_name               = aws_key_pair.public_ec2_keypair.key_name # Reference the key pair name
  vpc_security_group_ids = [aws_security_group.public_sg.id]
  subnet_id              = var.public_subnet_id
  associate_public_ip_address = true

  tags = {
    Name = "${var.instance_name}-public"
  }
}
resource "aws_key_pair" "public_ec2_keypair" {
  key_name   = "MWVPC-EC2-public_key"
  public_key = file("MWVPC-EC2-public_key.pub")
}

/*
# ----------------------------------------
# Generate a new RSA private key (4096-bit)
# This will be used to create a key pair for EC2 instance access
# ----------------------------------------
resource "tls_private_key" "webserver_rsa" {
  algorithm = "RSA"
  rsa_bits  = 4096
}
# ----------------------------------------
# Create an AWS EC2 Key Pair using the public part of the above key
# This key pair will be attached to the EC2 instance
# ----------------------------------------
resource "aws_key_pair" "public_ec2_keypair" {
  key_name   = "public_ec2_key"
  public_key = tls_private_key.webserver_rsa.public_key_openssh
}
# ----------------------------------------
# Save the private key locally as a .pem file
# This file will be used to SSH into the EC2 instance
# ----------------------------------------
resource "local_file" "public_ec2_private_key" {
  content  = tls_private_key.webserver_rsa.private_key.pem
  filename = "public_ec2_key.pem"
  file_permission = "0400"
}
*/
########################################################
# Private Security Group for private EC2
resource "aws_security_group" "private_sg" {
  name        = "${var.vpc_name}-Private-SG"
  description = "Allow SSH access"
  vpc_id      = var.vpc_id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    #cidr_blocks = ["0.0.0.0/0"]
    security_groups  = [aws_security_group.public_sg.id]
  }
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    #cidr_blocks = [var.public_subnet_cidrs] # Public subnet cidr private ec2 instance can acess (SSH) from public subnet ip's
    security_groups  = [aws_security_group.public_sg.id] #Instead of CIDR blocks, allow ingress from the public EC2's security group directly:traffic from the actual EC2 instance using the public SG can reach the private one.
  }


  tags = {
    Name = "${var.vpc_name}-Private-SG"
  }
}
resource "aws_instance" "AppServer" {
  ami                     = var.ami_id
  instance_type           = var.instance_type
  #key_name               = var.key_name
  key_name               = aws_key_pair.private_ec2_keypair.key_name # Reference the key pair name
  vpc_security_group_ids = [aws_security_group.private_sg.id]
  subnet_id               = var.private_subnet_id
  associate_public_ip_address = false

tags = {
    Name = "${var.instance_name}-private"
  }
}
resource "aws_key_pair" "private_ec2_keypair" {
  key_name   = "MWVPC-EC2-private_key"
  public_key = file("MWVPC-EC2-private_key.pub")
}
