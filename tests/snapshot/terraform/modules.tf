module "servers" {
  source = "./app-cluster"

  servers = 5
}

resource "aws_elb" "example" {
  # ...

  instances = module.servers.instance_ids
}
