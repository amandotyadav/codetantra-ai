import { AppError } from "~services/errors"
import * as gemini from "~services/gemini"
import * as openai from "~services/openai"
import type { GenerateSolutionInput, SolutionResult } from "~services/prompt"
import { getActiveApiKey, getProvider, type Provider } from "~services/storage"

export type { GenerateSolutionInput, SolutionResult }

export const testApiKey = (provider: Provider, apiKey: string) =>
  provider === "openai" ? openai.testApiKey(apiKey) : gemini.testApiKey(apiKey)

/**
 * Calls whichever provider the user currently has selected, using that
 * provider's own stored API key. `onDelta` is called with each new chunk
 * of raw text as the response streams in.
 */
export const generateSolution = async (
  input: GenerateSolutionInput,
  onDelta?: (delta: string) => void
): Promise<SolutionResult> => {
  const provider = await getProvider()
  const apiKey = await getActiveApiKey()

  if (!apiKey) {
    throw new AppError("NO_API_KEY", `No ${provider} API key configured`)
  }

  return provider === "openai"
    ? openai.generateSolution(apiKey, input, onDelta)
    : gemini.generateSolution(apiKey, input, onDelta)
}
