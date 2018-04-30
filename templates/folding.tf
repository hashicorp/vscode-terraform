resource "aws_s3_bucket" "folding-bucket" {
  acceleration_status = "true"

  #region Smurf
  bucket = "true"

  #endregion
}

#region Another region
variable "apa" {}

#endregion

