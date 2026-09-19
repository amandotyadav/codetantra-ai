import { describe, expect, it } from "vitest"

import { readSseData } from "~services/sse"

const sseResponse = (body: string): Response => {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(body))
      controller.close()
    }
  })
  return new Response(stream)
}

describe("readSseData", () => {
  it("yields each data payload in order", async () => {
    const response = sseResponse(
      'data: {"a":1}\n\ndata: {"a":2}\n\ndata: [DONE]\n\n'
    )

    const chunks: string[] = []
    for await (const data of readSseData(response)) {
      chunks.push(data)
    }

    expect(chunks).toEqual(['{"a":1}', '{"a":2}', "[DONE]"])
  })

  it("handles a data payload split across multiple stream reads", async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"a":'))
        controller.enqueue(encoder.encode("1}\n\n"))
        controller.close()
      }
    })

    const chunks: string[] = []
    for await (const data of readSseData(new Response(stream))) {
      chunks.push(data)
    }

    expect(chunks).toEqual(['{"a":1}'])
  })

  it("ignores blank lines and non-data lines", async () => {
    const response = sseResponse("event: ping\n\ndata: hello\n\n\n")

    const chunks: string[] = []
    for await (const data of readSseData(response)) {
      chunks.push(data)
    }

    expect(chunks).toEqual(["hello"])
  })
})
