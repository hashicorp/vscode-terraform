export type MatchingType = "FUZZY" | "PREFIX" | "EXACT";
export type MatchExpression = string | { exclude?: boolean, type: MatchingType, match: string | string[] };

function fuzzyMatch(value: string, test: string | string[]): boolean {
  if (typeof test === "string")
    return value.indexOf(test) !== -1;

  return test.findIndex(t => value.indexOf(t) !== -1) !== -1;
}

function prefixMatch(value: string, test: string | string[]): boolean {
  if (typeof test === "string")
    return value.indexOf(test) === 0;

  return test.findIndex(t => value.indexOf(t) === 0) !== -1;
}

function exactMatch(value: string, test: string | string[]): boolean {
  if (typeof test === "string")
    return value === test;

  return test.indexOf(value) !== -1;
}

function matchHelper(type: MatchingType, value: string, test: string | string[]): boolean {
  switch (type) {
    case "FUZZY":
      return fuzzyMatch(value, test);
    case "PREFIX":
      return prefixMatch(value, test);
    case "EXACT":
      return exactMatch(value, test);
  }
}

export function match(value: string, expression: MatchExpression, defaultType: MatchingType = "FUZZY"): boolean {
  if (!value)
    return null;

  if (typeof expression === "string")
    expression = {
      type: defaultType,
      match: expression
    };

  const expressionMatches = matchHelper(expression.type, value, expression.match);
  if (expression.exclude)
    return !expressionMatches;
  return expressionMatches;
}
