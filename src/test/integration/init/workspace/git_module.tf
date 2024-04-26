module "iam_account" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-iam.git//modules/iam-account?ref=39e42e1f847afe5fd1c1c98c64871817e37e33ca"

  account_alias = "test"
}
