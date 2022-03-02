instance_size = (                   #Comment
  length(var.instance_size) > 0 ? ( #Comment
    var.instance_size               #If instance size is provided, use it.
  )                                 #Comment
  :                                 #Comment
  (var.insane_mode ?
    lookup(local.insane_mode_instance_size_map, local.cloud, null) #If instance size is not provided and var.insane_mode is true, lookup in this table.
    :                                                              #
    lookup(local.instance_size_map, local.cloud, null)             #If instance size is not provided and var.insane_mode is false, lookup in this table.
  )
)

# Comment

variable "test" {
  default = "test"
}
