locals {
  a = 3
  b = [1]

  c = {
    d = 3
  }
}

resource "some_type" "name" {
  property = "${local.a}"
}
