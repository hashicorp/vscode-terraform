ipam_configuration = {
  us-east-1 = {
    cidr   = ["10.0.0.0/16"]
    locale = "us-east-1"

    sub_pools = {
      dev = {
        cidr                              = ["10.0.0.0/20"]
        allocation_default_netmask_length = 28

        sub_pools = {
          app_team_b = {
            cidr        = ["10.0.0.0/24"]
            description = "app team b's space in us-east-1"
          }
          app_team_a = {
            cidr = ["10.0.1.0/24"]
          }
        }
      }

      stage = {
        cidr = ["10.0.16.0/20"]
      }
    }
  }
}
