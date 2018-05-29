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
    __diffChangeType?: DiffChangeType; // not part of actual plan, added during processing
  }

  export enum DiffChangeType {
    DiffNone = 'diff-none',
    DiffDestroyCreate = 'diff-destroy-create',
    DiffDestroy = 'diff-destroy',
    DiffCreate = 'diff-create',
    DiffUpdate = 'diff-update'
  }

  export function getChangeType(d: InstanceDiff): DiffChangeType {
    // copied from: https://github.com/hashicorp/terraform/blob/d29994e24788ad187b12b71c50ef70f534a99996/terraform/diff.go#L370

    // empty:
    if (empty(d))
      return DiffChangeType.DiffNone;

    if (requiresNew(d) && (d.Destroy || d.DestroyTainted)) {
      return DiffChangeType.DiffDestroyCreate;
    }

    if (d.Destroy || d.DestroyDeposed) {
      return DiffChangeType.DiffDestroy;
    }

    if (requiresNew(d)) {
      return DiffChangeType.DiffCreate;
    }

    return DiffChangeType.DiffUpdate;
  }

  export function requiresNew(d: InstanceDiff): boolean {
    if (d.DestroyTainted)
      return true;

    for (let attributeId in d.Attributes) {
      const attribute = d.Attributes[attributeId];
      if (attribute.RequiresNew) {
        return true;
      }
    }

    return false;
  }

  export function empty(instance: InstanceDiff) {
    if (!instance)
      return true;

    return !instance.Destroy &&
      !instance.DestroyTainted &&
      !instance.DestroyDeposed &&
      Object.keys(instance.Attributes).length === 0;
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

  let plan = <terraform.Plan>rawPlan;
  for (let module of plan.Diff.Modules) {
    for (let resourceId in module.Resources) {
      let resource = module.Resources[resourceId];

      resource.__diffChangeType = terraform.getChangeType(resource);
    }
  }

  return plan;
}
