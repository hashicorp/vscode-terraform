const awsResources: ITerraformData = require("../data/terraform-provider-aws.json");
const azureResources: ITerraformData = require("../data/terraform-provider-azurerm.json");
const googleResources: ITerraformData = require("../data/terraform-provider-google.json");
const ociResources: ITerraformData = require("../data/terraform-provider-oci.json");
const openstackResources: ITerraformData = require("../data/terraform-provider-openstack.json");
export const terraformConfigAutoComplete: ITerraformConfigAutoComplete = require("../data/terraform-config.json");

import * as _ from "lodash";

export const allProviders: ITerraformData = _.merge({}, awsResources, azureResources, googleResources, ociResources, openstackResources);

export interface IFieldDef {
    name: string;
    description: string;
    args: IFieldDef[];
}

export interface IResourceFormat {
    name: string;
    type: string;
    url: string;
    groupName: string;
    args: IFieldDef[];
    attrs: IFieldDef[];
}

export interface ITerraformData {
    data: { [key: string]: IResourceFormat };
    resource: { [key: string]: IResourceFormat };
}

export interface ITerraformConfigAutoComplete {
    builtInFunctions: IFieldDef[];
    resource: IFieldDef[];
    variable: IFieldDef[];
    output: IFieldDef[];
    module: IFieldDef[];
}

export function findResourceFormat(sectionType: string, resourceType: string): IResourceFormat {
    let types = allProviders[sectionType];
    if (!types)
        return null;

    return types[resourceType];
}