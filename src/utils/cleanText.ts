export const cleanQuestion = (text: string): string => {
  return text.replace(/\n+/g, "\n").replace(/\s+/g, " ").trim()
}
