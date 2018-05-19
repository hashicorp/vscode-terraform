resource "azurerm_virtual_network" "vnet" {
  name                = "${var.PREFIX}-VNET"
  address_space       = ["${var.vnet}"]
  location            = "${azurerm_resource_group.resourcegroupvnet.location}"
  resource_group_name = "${azurerm_resource_group.resourcegroupvnet.name}"
}
