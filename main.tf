module "vpc" {
  source                = "./modules/vpc"
  vpc_cidr              = var.vpc_cidr
  vpc_name              = var.vpc_name
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  public_az             = var.public_az
  private_az            = var.private_az
}

module "ec2" {
  source            =  "./modules/ec2"
  ami_id            = var.ami_id
  instance_type     = var.instance_type
  vpc_id            = module.vpc.vpc_id
  vpc_name          = var.vpc_name
  public_subnet_id  = module.vpc.public_subnet_id
  private_subnet_id = module.vpc.private_subnet_id
  public_subnet_cidrs  = var.public_subnet_cidrs
  instance_name = var.instance_name
}
