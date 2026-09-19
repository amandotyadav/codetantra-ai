/**
 * Reads a Server-Sent-Events response body and yields each event's raw
 * `data:` payload as it arrives. Shared between the Gemini and OpenAI
 * streaming clients, which both use this wire format.
 */
export async function* readSseData(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    let newlineIndex: number
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim()
      buffer = buffer.slice(newlineIndex + 1)

      if (line.startsWith("data:")) {
        const data = line.slice("data:".length).trim()
        if (data) yield data
      }
    }
  }
}
