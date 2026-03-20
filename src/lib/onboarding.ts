import { getValidationErrorMessage, onboardingFormSchema, type OnboardingFormData } from "../../shared/schemas";
import type { ProfileInput } from "../types";

export type { OnboardingFormData } from "../../shared/schemas";

export function normalizeOnboardingProfile(formData: OnboardingFormData): ProfileInput {
    return onboardingFormSchema.parse(formData);
}

export function validateOnboardingProfile(formData: OnboardingFormData) {
    return onboardingFormSchema.safeParse(formData);
}

export function getOnboardingValidationError(formData: OnboardingFormData) {
    const result = validateOnboardingProfile(formData);
    return result.success ? null : getValidationErrorMessage(result.error, "Please review your onboarding answers.");
}
