
provider "aws" {
  alias = "this"
}

provider "azurerm" {
  alias = "this"
}

variable "boolean_variable" {
  default = true
  type    = bool
}

locals {
  number_local = 500
}

variable "number_variable" {
  default = 10
  type    = number
}

list "concept_pet" "name_1" {
  provider         =
  limit            =
  include_resource =
  count            = 10
  config {

  }
}
