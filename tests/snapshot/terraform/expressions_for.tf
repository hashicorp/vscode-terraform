[for s in var.list : upper(s)]

[for k, v in var.map : length(k) + length(v)]

[for i, v in var.list : "${i} is ${v}"]

{for s in var.list : s => upper(s)}

[for s in var.list : upper(s) if s != ""]

locals {
  admin_users = {
    for name, user in var.users : name => user if user.is_admin
  }
  regular_users = {
    for name, user in var.users : name => user
    if !user.is_admin
  }
  admin_users_list = [
    for name, user in var.users : name if user.is_admin
  ]
  regular_users_list = [
    for name, user in var.users : name
    if !user.is_admin
  ]
}

locals {
  users_by_role = {
    for name, user in var.users : user.role => name...
  }
}

