resource "aws_s3_bucket" "simple" {
  bucket = "value"

  group {
    sub = "subvalue"
  }
}
