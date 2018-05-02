variable "my_map" {
  default = {
    key = "value"
  }
}

resource "aws_s3_bucket" "my_bucket" {
  bucket_name = "${var.my_map["key"]}"
}