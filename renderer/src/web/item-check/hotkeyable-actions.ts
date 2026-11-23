import { Host } from '@/web/background/IPC'
import { AppConfig, Config } from '@/web/Config'
import { ParsedItem, parseClipboard } from '@/parser'

const POEDB_LANGS: Record<Config['language'], string> = {
  'en': 'us',
  'ru': 'ru',
  'cmn-Hant': 'tw',
  'ko': 'kr'
}

export function registerActions () {
  Host.onEvent('MAIN->CLIENT::item-text', (e) => {
    if (!['open-wiki', 'open-craft-of-exile', 'open-pobarchives', 'open-poedb', 'search-similar'].includes(e.target)) return
    const parsed = parseClipboard(e.clipboard)
    if (!parsed.isOk()) return

    if (e.target === 'open-wiki') {
      openWiki(parsed.value)
    } else if (e.target === 'open-craft-of-exile') {
      openCoE(parsed.value)
    } else if (e.target === 'open-pobarchives') {
      openPobArchives(parsed.value)
    } else if (e.target === 'open-poedb') {
      openPoedb(parsed.value)
    } else if (e.target === 'search-similar') {
      findSimilarItems(parsed.value)
    }
  })
}

export function openWiki (item: ParsedItem) {
  window.open(`https://www.poewiki.net/wiki/${item.info.refName}`)
}
export function openPoedb (item: ParsedItem) {
  const slug = encodeURIComponent(item.info.refName.replaceAll("'", '').replaceAll(' ', '_'))
  window.open(`https://poedb.tw/${POEDB_LANGS[AppConfig().language]}/${slug}`)
}
export function openCoE (item: ParsedItem) {
  const encodedClipboard = encodeURIComponent(item.rawText)
  window.open(`https://craftofexile.com/?game=poe1&eimport=${encodedClipboard}`)
}

// PoB Archives crafting planner: ?item= takes the base64url of the item's copied text.
// This app only reads Path of Exile 1 items; a PoE2 build would send to /craft/poe2.
const POBARCHIVES_CRAFT = 'https://pobarchives.com/craft/poe'
const POBARCHIVES_PLAYGROUND = 'https://pobarchives.com/playground/poe'

export function openPobArchives (item: ParsedItem) {
  window.open(`${POBARCHIVES_CRAFT}?item=${encodeItemText(item)}`)
}
export function openPobArchivesPlayground (item: ParsedItem) {
  window.open(`${POBARCHIVES_PLAYGROUND}?item=${encodeItemText(item)}`)
}

function encodeItemText (item: ParsedItem): string {
  const bytes = new TextEncoder().encode(item.rawText)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export function findSimilarItems (item: ParsedItem) {
  const text = JSON.stringify(item.info.name)
  Host.sendEvent({
    name: 'CLIENT->MAIN::user-action',
    payload: { action: 'stash-search', text }
  })
}
