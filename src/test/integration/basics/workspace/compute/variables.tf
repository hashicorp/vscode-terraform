variable "instance_name" {
  type        = string
  description = "Name of the compute instance"
}

variable "machine_type" {
  type    = string
  default = "f1-micro"
}
