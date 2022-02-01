output "instance_ip_addr" {
  value = aws_instance.server.private_ip
}

output "instance_ip_addr" {
  value       = aws_instance.server.private_ip
  description = "The private IP address of the main server instance."

  depends_on = [
    aws_security_group_rule.local_access,
  ]
}
