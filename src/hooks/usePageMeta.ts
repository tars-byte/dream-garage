/**
 * Dynamically update <title> and OG <meta> tags for the current page.
 * Used on garage public pages so WhatsApp/iMessage unfurl the right preview.
 */
export function usePageMeta({
  title,
  description,
  imageUrl,
  url,
}: {
  title: string
  description: string
  imageUrl?: string
  url?: string
}) {
  document.title = title

  setMeta('og:title', title)
  setMeta('og:description', description)
  setMeta('description', description)
  if (imageUrl) setMeta('og:image', imageUrl)
  if (url) setMeta('og:url', url)
  setMeta('twitter:title', title)
  setMeta('twitter:description', description)
  if (imageUrl) setMeta('twitter:image', imageUrl)
}

function setMeta(nameOrProperty: string, content: string) {
  // Try property= first (OG), then name=
  let el =
    document.querySelector<HTMLMetaElement>(`meta[property="${nameOrProperty}"]`) ??
    document.querySelector<HTMLMetaElement>(`meta[name="${nameOrProperty}"]`)

  if (!el) {
    el = document.createElement('meta')
    const isOg = nameOrProperty.startsWith('og:') || nameOrProperty.startsWith('twitter:')
    el.setAttribute(isOg ? 'property' : 'name', nameOrProperty)
    document.head.appendChild(el)
  }

  el.setAttribute('content', content)
}
