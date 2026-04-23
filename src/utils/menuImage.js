const hashText = (text) =>
  Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0)

export const getMenuImageUrl = (name) => {
  const prompt = `${name}, japanese food photo, realistic, studio lighting, high detail`
  const seed = hashText(name)
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=320&height=320&seed=${seed}&nologo=true`
}
