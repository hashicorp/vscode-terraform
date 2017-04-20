resource "aws_subnet" "worker_subnet" {
  count = "${var.external_vpc_id == "" ? var.worker_az_count : 0}"

  vpc_id = "${data.aws_vpc.cluster_vpc.id}"

  cidr_block = "${lookup(var.worker_subnets,
    "${element(concat(keys(var.worker_subnets), list("padding")), count.index)}",
    "${cidrsubnet(data.aws_vpc.cluster_vpc.cidr_block, 4, count.index + var.worker_az_count)}")
  }"

  availability_zone = "${ "${length(keys(var.worker_subnets))}" > 0 ? 
    "${element(concat(keys(var.worker_subnets), list("padding")), count.index)}" : 
    "${data.aws_availability_zones.azs.names[count.index]}" 
  }"

  tags = "${merge(map(
      "Name", "worker-${ "${length(keys(var.worker_subnets))}" > 0 ? 
    "${element(concat(keys(var.worker_subnets),list("padding")), count.index)}" : 
    "${data.aws_availability_zones.azs.names[count.index]}" }",
      "KubernetesCluster", "${var.cluster_name}",
      "kubernetes.io/role/internal-elb", ""
    ), var.extra_tags)}"
}
