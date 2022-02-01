"hello"

"\n\r\t\"\\"

"$${}"

"%%{}"

thing = <<EOT
hello
world
EOT

block {
  value = <<EOT
hello
world
EOT
}

block {
  value = <<-EOT
  hello
    world
  EOT
}

"Hello, ${var.name}!"

"Hello, %{ if var.name != "" }${var.name}%{ else }unnamed%{ endif }!"

<<EOT
%{ for ip in aws_instance.example.*.private_ip }
server ${ip}
%{ endfor }
EOT

<<EOT
%{ for ip in aws_instance.example.*.private_ip ~}
server ${ip}
%{ endfor ~}
EOT


