/** SNS・LINE の公式URL。別商材では VITE_* で上書き。 */
const env = import.meta.env

export const brandSocial = {
  instagram: env.VITE_SOCIAL_INSTAGRAM || 'https://www.instagram.com/ohaco.yokohama/',
  lineFriend: env.VITE_SOCIAL_LINE || 'https://line.me/ti/p/@349nlxlw',
  tiktok: env.VITE_SOCIAL_TIKTOK || '',
  threads: env.VITE_SOCIAL_THREADS || '',
}
