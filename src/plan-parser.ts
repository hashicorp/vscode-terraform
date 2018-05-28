const readPlan = require('./hcl-hil.js').readPlan;

export namespace terraform {

enum DiffAttrType {
  DiffAttrUnknown = 0,
  DiffAttrInput,
  DiffAttrOutput
}

export interface ResourceAttrDiff {
  Old: string;
  New: string;
  NewComputed: boolean;
  NewRemoved: boolean;
  NewExtra: any;
  RequiresNew: boolean;
  Sensitive: boolean;
  Diff: DiffAttrType;
}

export interface InstanceDiff {
  Attributes: { [key: string]: ResourceAttrDiff };
  Destroy: boolean;
  DestroyDeposed: boolean;
  DestroyTainted: boolean;
  Meta: { [key: string]: any };
}

export interface ModuleDiff {
  Path: string[];
  Resources: { [key: string]: InstanceDiff }
  Destroy: boolean
}

export interface Diff {
  Modules: ModuleDiff[]
}

export interface Plan {
  Diff: Diff;
  Module: any;
  State: any;
  Vars: { [key: string]: any };
  Targets: string[];
  TerraformVersion: string;
  ProviderSHA256s: { [key: string]: any };
  Backend: any;
  Destroy: boolean;
}

}  // namespace terraform

export function parsePlan(buffer: Buffer): terraform.Plan {
  let [rawPlan, error] = readPlan(buffer);
  if (error) {
    throw new Error(`Error: ${error.Err}`);
  }

  return <terraform.Plan>rawPlan;
}
