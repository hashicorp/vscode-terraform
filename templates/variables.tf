variable "string" {
  default = "default-string"
}

variable "list" {
  type    = "list"
  default = ["item1", "item2"]
}

variable "map" {
  type = "map"

  default = {
    "key1" = "value1"
    "key2" = "value2"
  }
}

variable "region" {
  default = "ap-south-1"
}
