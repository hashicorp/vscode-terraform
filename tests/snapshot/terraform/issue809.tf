locals {
  key_name = "testing"
  test_example = {
    (local.key_name): "test"
  }
}

variable "test" {
  default = "test"
}
