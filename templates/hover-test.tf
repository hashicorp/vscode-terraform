variable "no-default" {}

resource "aws_s3_bucket" "no-default-reference" {
  bucket = "${var.no-default}"
}

output "smurf" {
  value = "${aws_s3_bucket.no-default-reference.bucket}"
}
