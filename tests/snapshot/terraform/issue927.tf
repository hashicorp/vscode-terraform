variable "foo" {}
output "result-val" { value = var.foo }

variable "some-var" {
  default = "value"
}

module "foo-mod" {
  source = "./foo"
  foo = var.some-var
}

module "bar" {
  source = "./foo"
  foo = module.foo-mod.result-val
}