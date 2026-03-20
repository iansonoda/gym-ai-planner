import scenarioMatrix from "./scenario-matrix.json";

export interface UserScenarioDefinition {
    id: string;
    title: string;
    profileKey?: string;
    mode?: "same" | "update" | "change";
}

export interface InputCombinationDefinition {
    id: string;
    title: string;
}

export interface PlanGenerationOutcomeDefinition {
    id: string;
    title: string;
    expected: "success" | "failure";
}

export interface PerformanceTargetDefinition {
    id: string;
    title: string;
    thresholdMs: number;
}

export interface ValidationOutcomeDefinition {
    id: string;
    title: string;
}

export const userScenarios = scenarioMatrix.userScenarios as UserScenarioDefinition[];
export const inputCombinations = scenarioMatrix.inputCombinations as InputCombinationDefinition[];
export const planGenerationOutcomes =
    scenarioMatrix.planGenerationOutcomes as PlanGenerationOutcomeDefinition[];
export const requestValidationOutcomes =
    scenarioMatrix.requestValidationOutcomes as ValidationOutcomeDefinition[];
export const aiValidationOutcomes =
    scenarioMatrix.aiValidationOutcomes as ValidationOutcomeDefinition[];
export const performanceTargets =
    scenarioMatrix.performanceTargets as PerformanceTargetDefinition[];
