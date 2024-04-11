terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  credentials = file(var.credentials_file)

  project = var.project
  region  = var.region
  zone    = var.zone
}

module "compute" {
  source = "./compute"

  instance_name = "terraform-machine"

}

resource "aws_instance" "name" {

}

resource "google_access_context_manager_access_level" "name" {
  
}
