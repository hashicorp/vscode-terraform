output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_id" {
  value = aws_subnet.public_subnet.id
}

output "private_subnet_id" {
  value = aws_subnet.private_subnet.id
}

output "internet_gateway_id" {
  value = aws_internet_gateway.igw.id
}

output "public_route_table_id" {
  value = aws_route_table.public_rt.id
}
/*
output "public_route_table_association_id" {
  value = aws_route_table_association.public_rt_assoc.id
}
*/
output "private_route_table_id" {
  value = aws_route_table.private_rt.id
}
/*
output "private_route_table_association_id" {
  value = aws_route_table_association.private_rt_assoc.id
}
*/
