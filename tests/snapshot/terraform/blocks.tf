resource "aws_instance" "web" {
  ami           = "ami-a1b2c3d4"
  instance_type = "t2.micro"
  timeouts {
    create = "60m"
    delete = "2h"
  }
}
