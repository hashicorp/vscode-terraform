locals {
  a = "a"
  b = "c"
  c = "d"

  ternary = "${local.a ? local.b : local.c}"
}

