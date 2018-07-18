const awsResources: ITerraformData = require("../data/terraform-provider-aws.json");
const azureResources: ITerraformData = require("../data/terraform-provider-azurerm.json");
const googleResources: ITerraformData = require("../data/terraform-provider-google.json");
export const terraformConfigAutoComplete: ITerraformConfigAutoComplete = require("../data/terraform-config.json");

import * as _ from "lodash";

// export const allProviders: ITerraformData = _.merge({}, awsResources, azureResources, googleResources);
export const allProviders: ITerraformData = require("../data/terraform-provider-ranked.json")
export const moduleSources: IModuleSourceData = require("../data/module-source-inputs.json")

export interface IFieldDef {
    name: string;
    description: string;
    args: IFieldDef[];
}

export interface IModuleArgsDef {
    name: string;
    description: string;
    default: any;
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
    module: { [key: string]: IModuleFormat}
}

export interface IModuleSourceData {
    [key: string]: IModuleFormat
}

export interface IModuleFormat {
    name: string;
    source: string;
    url: string;
    provider: string;
    downloads: string;
    descriptions: string;
    args: IModuleArgsDef[];
}

export interface ITerraformConfigAutoComplete {
    builtInFunctions: IFieldDef[];
    resource: IFieldDef[];
    variable: IFieldDef[];
    output: IFieldDef[];
    module: IModuleArgsDef[];
}

export function findResourceFormat(sectionType: string, resourceType: string): any {
    let types: any;
    if (sectionType === "module") {
        types = moduleSources;
    } else {
        types = allProviders[sectionType];
    }
    if (!types)
        return null;

    return types[resourceType];
}