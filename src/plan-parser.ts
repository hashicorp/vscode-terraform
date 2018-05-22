const planToJSON = require('./hcl-hil.js').planToJSON;

export function parsePlan(buffer: Buffer): any {
  let [json, error] = planToJSON(buffer.buffer);
  if (error) {
    throw new Error(`Error: ${error}`);
  }

  return JSON.parse(json);
}