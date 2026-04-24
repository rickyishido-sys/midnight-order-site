const hashText = (text) => Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0)

/**
 * 注文ページでも imageKey 優先でローカル画像を使う。
 * ローカル画像が無い場合だけ生成画像にフォールバック。
 */
export const getMenuImageUrl = (item) => {
  const key = String(item?.imageKey || '').trim()
  if (key) return `/images/menu/${encodeURIComponent(key)}.png`
  const name = String(item?.name || '')
  const prompt = `${name}, japanese food photo, realistic, studio lighting, high detail`
  const seed = hashText(name)
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=320&height=320&seed=${seed}&nologo=true`
}
