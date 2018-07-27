#region
variable "stage" {
  default = "gamma"
}

#endregion

variable "ipsum" {
  type = "map"

  default = {
    colot = "dolor"
  }
}

resource "aws_s3_bucket" "agent_bucket" {
  bucket = "${var.stage}-${var.region}-mybucket"
  acl    = "private"

  logging {
    target_bucket = "${var.stage}-${var.region}-mymonitoringbucket"
    target_prefix = "aprefix/"
  }

  policy = <<EOF
  {
    sdfds
    sdfds,
    "Fsdfsd"
  }
EOF
}

output "iam_user_agent" {
  value = "smurf"
}
