variable "stage" {
  default = "gamma"
}

variable "region" {
  default = "us-east-1"
}

resource "aws_s3_bucket" "agent_bucket" {
  bucket = "${var.stage}-${var.region}-mybucket"
  acl    = "private"

  logging {
    target_bucket = "${var.stage}-${var.region}-mymonitoringbucket"
    target_prefix = "aprefix/"
  }
}
