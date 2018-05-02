variable "list2" {
  default = ["key", "key2", "key3"]
}

resource "aws_s3_bucket" "list_bucket" {
  bucket_name = "${var.list2[0]}"
}
