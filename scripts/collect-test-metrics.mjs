import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const reportPath = path.join(rootDir, "test-results", "vitest-report.json");
const matrixPath = path.join(rootDir, "test", "fixtures", "scenario-matrix.json");
const summaryPath = path.join(rootDir, "test-results", "metrics-summary.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function countPassed(definitions, assertions) {
  const passedNames = new Set(
    assertions.filter((assertion) => assertion.status === "passed").map((assertion) => assertion.title),
  );

  return definitions.filter((definition) => passedNames.has(definition.title)).length;
}

const report = readJson(reportPath);
const matrix = readJson(matrixPath);
const assertions = report.testResults.flatMap((suite) => suite.assertionResults ?? []);

const userScenarioCount = matrix.userScenarios.length;
const passedUserScenarios = countPassed(matrix.userScenarios, assertions);

const inputCombinationCount = matrix.inputCombinations.length;
const passedInputCombinations = countPassed(matrix.inputCombinations, assertions);

const planGenerationCount = matrix.planGenerationOutcomes.length;
const passedPlanGeneration = countPassed(matrix.planGenerationOutcomes, assertions);
const expectedSuccessCount = matrix.planGenerationOutcomes.filter((item) => item.expected === "success").length;
const expectedFailureCount = matrix.planGenerationOutcomes.filter((item) => item.expected === "failure").length;
const planGenerationPassRate = planGenerationCount === 0
  ? 0
  : Number(((passedPlanGeneration / planGenerationCount) * 100).toFixed(1));

const performanceSummaries = matrix.performanceTargets.map((target) => {
  const assertion = assertions.find((item) => item.name === target.title);
  const matchingAssertion = assertions.find((item) => item.title === target.title);

  return {
    id: target.id,
    title: target.title,
    thresholdMs: target.thresholdMs,
    observedMs: matchingAssertion?.duration ?? null,
    passed: matchingAssertion?.status === "passed",
  };
});

const summary = {
  testedUserScenarios: {
    passed: passedUserScenarios,
    total: userScenarioCount,
  },
  handledInputCombinations: {
    passed: passedInputCombinations,
    total: inputCombinationCount,
  },
  planGenerationOutcomes: {
    passed: passedPlanGeneration,
    total: planGenerationCount,
    expectedSuccessCount,
    expectedFailureCount,
    passRate: planGenerationPassRate,
  },
  performanceTargets: performanceSummaries,
};

fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);

console.log("TEST_METRICS tested_user_scenarios=%d/%d", passedUserScenarios, userScenarioCount);
console.log("TEST_METRICS handled_input_combinations=%d/%d", passedInputCombinations, inputCombinationCount);
console.log(
  "TEST_METRICS plan_generation_cases=%d/%d expected_successes=%d expected_failures=%d pass_rate=%s%%",
  passedPlanGeneration,
  planGenerationCount,
  expectedSuccessCount,
  expectedFailureCount,
  planGenerationPassRate.toFixed(1),
);

for (const target of performanceSummaries) {
  const observed = target.observedMs === null ? "unavailable" : `${target.observedMs.toFixed(2)}ms`;
  console.log(
    "TEST_METRICS performance_target=%s observed=%s threshold=<%dms passed=%s",
    target.id,
    observed,
    target.thresholdMs,
    target.passed ? "true" : "false",
  );
}
