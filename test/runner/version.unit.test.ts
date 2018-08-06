import * as assert from 'assert';
import { ConstraintOperator, TerraformVersion, VersionConstraint, VersionRequirement } from '../../src/runner/version';

suite("Runner Tests", () => {
  suite("Version Tests", () => {
    test("parse simple version", () => {
      let version = TerraformVersion.parse("Terraform v0.11.7");

      assert(version);
      assert.equal(version.major, 0);
      assert.equal(version.minor, 11);
      assert.equal(version.micro, 7);
      assert(!version.development);
    });

    test("parse dev version", () => {
      let version = TerraformVersion.parse("Terraform v0.11.8-dev (2487af19453a0d55a428fb17150f87b24170ccc1+CHANGES)");

      assert(version);
      assert.equal(version.major, 0);
      assert.equal(version.minor, 11);
      assert.equal(version.micro, 8);
      assert(version.development);
    });

    test("newer version sorts higher than old version", () => {
      let oldVersion = TerraformVersion.parse("Terraform v0.10.7");
      let newVersion = TerraformVersion.parse("Terraform v0.11.8");

      assert(oldVersion.sort < newVersion.sort);
    });

    test("released version have a higher sort key than dev version", () => {
      let devVersion = TerraformVersion.parse("Terraform v0.11.8-dev (2487af19453a0d55a428fb17150f87b24170ccc1+CHANGES)");
      let relVersion = TerraformVersion.parse("Terraform v0.11.8");

      assert(relVersion.sort > devVersion.sort);
    });

    test("compare sorts versions in increasing order", () => {
      let versions = ["Terraform v0.11.8", "Terraform v0.9.1", "Terraform v1.2.3"].map(TerraformVersion.parse);

      versions.sort(TerraformVersion.compare);

      assert.equal(versions[0].toString(), "0.9.1");
      assert.equal(versions[1].toString(), "0.11.8");
      assert.equal(versions[2].toString(), "1.2.3");
    });
  });

  suite("Version Constraints Tests", () => {
    test("parse default constraint", () => {
      const constraint = VersionConstraint.parse("0.9.1");

      assert.equal(constraint.major, 0);
      assert.equal(constraint.minor, 9);
      assert.equal(constraint.micro, 1);
      assert.equal(constraint.operator, ConstraintOperator.Equal);
    });

    test("parse equal constraint", () => {
      const constraint = VersionConstraint.parse("= 0.9.1");

      assert.equal(constraint.major, 0);
      assert.equal(constraint.minor, 9);
      assert.equal(constraint.micro, 1);
      assert.equal(constraint.operator, ConstraintOperator.Equal);
    });

    test("parse constraint without micro", () => {
      const constraint = VersionConstraint.parse("= 0.9");

      assert.equal(constraint.major, 0);
      assert.equal(constraint.minor, 9);
      assert.equal(constraint.micro, undefined);
      assert.equal(constraint.operator, ConstraintOperator.Equal);
    });

    test("parse greater than constraint", () => {
      const constraint = VersionConstraint.parse("> 0.9");

      assert(constraint);
      assert.equal(constraint.operator, ConstraintOperator.GreaterThan);
    });

    test("parse greater than equal constraint", () => {
      const constraint = VersionConstraint.parse(">= 0.9");

      assert(constraint);
      assert.equal(constraint.operator, ConstraintOperator.GreaterThanEqual);
    });

    test("parse less than constraint", () => {
      const constraint = VersionConstraint.parse("< 0.9");

      assert(constraint);
      assert.equal(constraint.operator, ConstraintOperator.LessThan);
    });

    test("parse less than equal constraint", () => {
      const constraint = VersionConstraint.parse("<= 0.9");

      assert(constraint);
      assert.equal(constraint.operator, ConstraintOperator.LessThanEqual);
    });

    test("parse pessimistic constraint", () => {
      const constraint = VersionConstraint.parse("~> 0.9");

      assert(constraint);
      assert.equal(constraint.operator, ConstraintOperator.Pessimistic);
    });

    test("evaluate equal test", () => {
      const constraint = VersionConstraint.parse("=0.9.1");

      assert(constraint.isFulfilledBy(new TerraformVersion(0, 9, 1, false)));
      assert(!constraint.isFulfilledBy(new TerraformVersion(0, 9, 2, false)));
    });

    test("evaluate not equal test", () => {
      const constraint = VersionConstraint.parse("!=0.9.1");

      assert(!constraint.isFulfilledBy(new TerraformVersion(0, 9, 1, false)));
      assert(constraint.isFulfilledBy(new TerraformVersion(0, 9, 2, false)));
    });

    test("evaluate greater than test", () => {
      const constraint = VersionConstraint.parse(">0.9.0");

      assert(constraint.isFulfilledBy(new TerraformVersion(0, 9, 1, false)));
      assert(!constraint.isFulfilledBy(new TerraformVersion(0, 0, 1, false)));
    });

    test("evaluate greater than equal test", () => {
      const constraint = VersionConstraint.parse(">=0.9.0");

      assert(constraint.isFulfilledBy(new TerraformVersion(0, 9, 1, false)));
      assert(constraint.isFulfilledBy(new TerraformVersion(0, 9, 0, false)));
      assert(!constraint.isFulfilledBy(new TerraformVersion(0, 0, 1, false)));
    });

    test("evaluate less than test", () => {
      const constraint = VersionConstraint.parse("<0.9.0");

      assert(!constraint.isFulfilledBy(new TerraformVersion(0, 9, 1, false)));
      assert(constraint.isFulfilledBy(new TerraformVersion(0, 0, 1, false)));
    });

    test("evaluate less than equal test", () => {
      const constraint = VersionConstraint.parse("<=0.9.0");

      assert(!constraint.isFulfilledBy(new TerraformVersion(0, 9, 1, false)));
      assert(constraint.isFulfilledBy(new TerraformVersion(0, 9, 0, false)));
      assert(constraint.isFulfilledBy(new TerraformVersion(0, 0, 1, false)));
    });

    test("evaluate pessimistic test", () => {
      const constraint = VersionConstraint.parse("~>0.9.0");

      assert(constraint.isFulfilledBy(new TerraformVersion(0, 9, 1, false)));
      assert(constraint.isFulfilledBy(new TerraformVersion(0, 9, 9, false)));
      assert(!constraint.isFulfilledBy(new TerraformVersion(0, 10, 0, false)));
      assert(!constraint.isFulfilledBy(new TerraformVersion(0, 8, 9, false)));
    });
  });

  suite("VersionRequirement", () => {
    test("parse simple requirement", () => {
      const requirement = VersionRequirement.parse("0.9.1, >0.1.0");

      assert(requirement);
      assert.equal(requirement.constraints.length, 2);
      assert.equal(requirement.constraints[0].operator, ConstraintOperator.Equal);
      assert.equal(requirement.constraints[0].major, 0);
      assert.equal(requirement.constraints[0].minor, 9);
      assert.equal(requirement.constraints[0].micro, 1);

      assert.equal(requirement.constraints[1].operator, ConstraintOperator.GreaterThan);
      assert.equal(requirement.constraints[1].major, 0);
      assert.equal(requirement.constraints[1].minor, 1);
      assert.equal(requirement.constraints[1].micro, 0);
    });

    test("check if version fulfills requirement", () => {
      const requirement = VersionRequirement.parse(">0.9.3, <0.9.8");

      assert(requirement.isFulfilledBy(new TerraformVersion(0, 9, 4, false)));
      assert.deepEqual(requirement.failedConstraints(new TerraformVersion(0, 9, 4, false)), []);
    });

    test("return failed constrain", () => {
      const requirement = VersionRequirement.parse(">0.9.3, <0.9.8, >1.0");

      let result = requirement.failedConstraints(new TerraformVersion(0, 9, 9, false));
      assert.equal(result.length, 2);
      assert.equal(result[0].toString(), "< 0.9.8");
      assert.equal(result[1].toString(), "> 1.0");
    });
  });
});