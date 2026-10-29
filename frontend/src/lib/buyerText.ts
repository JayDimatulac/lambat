import { useCallback } from 'react'
import { useSettings } from './settings'

// Words for the buyer side. Same idea as i18n.ts, kept in its own file so the big dictionary stays untouched.
// Add a line to BOTH lists when you add a word: the compiler will tell you if one is missing.
const en = {
  sample: 'sample',
  'nav.pantalan': 'Pier', 'nav.offers': 'Offers', 'nav.needs': 'My needs', 'nav.orders': 'Orders', 'nav.stall': 'My stall', 'nav.need': 'I need',
  'home.hello': 'Hello', 'home.sub': 'Boats coming in to the pier',
  'home.stat.open': 'Lots for sale', 'home.stat.onway': 'On the way', 'home.stat.rescue': 'Rescued',
  'home.urgent': 'Sell-soon lots', 'home.urgent.sub': 'These fish need a buyer first', 'home.seeall': 'See all offers',
  'home.needs': 'What you need', 'home.needs.none': 'Tell fisherfolk what you need and the matching lots will show here.', 'home.needs.add': 'Post a need',
  'home.needs.match': '{n} matching lots', 'home.needs.nomatch': 'No match yet',
  'home.orders': 'Orders in progress', 'home.empty': 'No lots on the pier right now.',
  'offers.title': 'Offers from fisherfolk', 'offers.sub': 'Sorted by what must be sold first',
  'offers.all': 'All fish', 'offers.sort': 'Sort', 'sort.urgent': 'Most urgent', 'sort.price': 'Lowest price', 'sort.size': 'Biggest lot',
  'offers.empty': 'No offers for this fish right now.',
  'offer.rescue': 'Sell soon', 'offer.fresh': 'Fresh', 'offer.match': 'Matches what you need', 'offer.total': 'Total ₱{n}',
  'offer.buy': 'Buy now', 'offer.counter': 'Offer a price',
  'fair.title': 'Price', 'fair.low': 'below usual', 'fair.usual': 'about usual', 'fair.high': 'above usual', 'fair.usual.price': 'usual ₱{n}',
  'sheet.buy': 'Buy this lot?', 'sheet.counter': 'Offer your price', 'sheet.yourprice': 'Your price', 'sheet.asked': 'asked',
  'sheet.demo': 'Demo: the fisher answers within a few seconds.', 'sheet.confirmbuy': 'Yes, buy it', 'sheet.send': 'Send my offer', 'sheet.cancel': 'Not yet',
  'orders.title': 'Your orders', 'orders.active': 'Active', 'orders.done': 'Done', 'orders.empty': 'No orders yet. Find a lot in Offers.',
  'step.confirmed': 'Confirmed', 'step.onway': 'On the way', 'step.received': 'Received',
  'order.waiting': 'Waiting for the fisher’s answer…', 'order.declined': 'The fisher did not accept this price.', 'order.tryother': 'See other offers',
  'order.go': 'I am on my way', 'order.got': 'I received the fish', 'order.rescued': 'Rescued catch', 'order.total': '₱{n} total',
  'needs.title': 'What you need', 'needs.sub': 'Fisherfolk with matching fish will see your need.', 'needs.new': 'Post a need', 'needs.empty': 'No needs posted yet.',
  'needs.fish': 'Which fish?', 'needs.kg': 'How many kilos?', 'needs.when': 'When?', 'needs.max': 'Highest price you will pay (₱/kg)', 'needs.nomax': 'No limit',
  'when.today': 'Today', 'when.tomorrow': 'Tomorrow', 'when.week': 'This week', 'needs.post': 'Post my need', 'needs.close': 'Close this need', 'needs.closed': 'Closed', 'needs.view': 'See matching lots',
  'needs.line': '{kg} kg · {when}', 'needs.upto': 'up to ₱{n}/kg',
  'stall.title': 'My stall', 'stall.rescue': 'Rescue buyer', 'stall.rescue.sub': 'Buying fish that must be sold soon keeps them from being lost.',
  'stall.rescue.n': '{n} of 3 rescued orders', 'stall.rescue.got': 'You are a Rescue Buyer!',
  'stall.stats.orders': 'Orders received', 'stall.stats.kg': 'Kilos bought', 'stall.stats.rescued': 'Kilos rescued',
  'stall.night': 'Night at sea', 'stall.reset': 'Reset demo offers',
  'wait.title': 'Anchored, not yet landed', 'wait.text': 'An admin is checking your application. When it is approved, this page opens by itself.',
  'wait.s1': 'Sent', 'wait.s2': 'Being checked', 'wait.s3': 'Approved',
  'wait.no.title': 'Not approved yet', 'wait.no.why': 'Why', 'wait.no.fix': 'Fix your details and send again.', 'wait.no.send': 'Send again', 'wait.no.fill': 'Fill in every box.',
  'wait.ok': 'You are approved! Opening your pier…',
  'who': 'Account', 'unit.kg': 'kg',
'nav.alerts': 'Alerts',
  'alerts.title': 'Alerts', 'alerts.sub': 'New lots for your needs and news about your orders.', 'alerts.empty': 'Nothing new yet. Post a need and matching lots will appear here.', 'alerts.new': 'New',
  'alert.match': 'Matching lot for your need', 'alert.match.body': '{fisher} · {place} · ₱{ask}/kg',
  'alert.o.confirmed': 'Order confirmed', 'alert.o.onway': 'You are on the way', 'alert.o.received': 'Fish received',
  'ago.now': 'just now', 'ago.min': '{n} min ago', 'ago.hr': '{n} h ago',
  'fneed.title': 'Someone is looking for {species}', 'fneed.offer': 'Offer my catch', 'fneed.sent': 'Offered. The buyer can see your catch now.', 'fneed.others': 'See other buyers',
} as const

type BKey = keyof typeof en
const fil: Record<BKey, string> = {
  sample: 'halimbawa',
  'nav.pantalan': 'Pantalan', 'nav.offers': 'Mga Alok', 'nav.needs': 'Kailangan Ko', 'nav.orders': 'Mga Order', 'nav.stall': 'Aking Pwesto', 'nav.need': 'Kailangan ko',
  'home.hello': 'Kumusta', 'home.sub': 'Mga bangkang paparating sa pantalan',
  'home.stat.open': 'Lote na ibinebenta', 'home.stat.onway': 'Papunta na', 'home.stat.rescue': 'Naligtas',
  'home.urgent': 'Madaliang ibenta', 'home.urgent.sub': 'Ang mga isdang ito ang unang kailangan ng mamimili', 'home.seeall': 'Tingnan ang lahat ng alok',
  'home.needs': 'Ang kailangan mo', 'home.needs.none': 'Sabihin sa mga mangingisda ang kailangan mo at lalabas dito ang mga tugmang lote.', 'home.needs.add': 'Mag-post ng kailangan',
  'home.needs.match': '{n} tugmang lote', 'home.needs.nomatch': 'Wala pang tugma',
  'home.orders': 'Mga order na isinasagawa', 'home.empty': 'Walang lote sa pantalan ngayon.',
  'offers.title': 'Mga alok ng mangingisda', 'offers.sub': 'Nakaayos ayon sa dapat unang maibenta',
  'offers.all': 'Lahat ng isda', 'offers.sort': 'Ayusin', 'sort.urgent': 'Pinakamadali', 'sort.price': 'Pinakamura', 'sort.size': 'Pinakamalaki',
  'offers.empty': 'Walang alok para sa isdang ito ngayon.',
  'offer.rescue': 'Madaliang ibenta', 'offer.fresh': 'Sariwa', 'offer.match': 'Tugma sa kailangan mo', 'offer.total': 'Kabuuan ₱{n}',
  'offer.buy': 'Bilhin na', 'offer.counter': 'Mag-alok ng presyo',
  'fair.title': 'Presyo', 'fair.low': 'mas mura sa karaniwan', 'fair.usual': 'karaniwan', 'fair.high': 'mas mataas sa karaniwan', 'fair.usual.price': 'karaniwan ₱{n}',
  'sheet.buy': 'Bilhin ang lote na ito?', 'sheet.counter': 'Mag-alok ng presyo', 'sheet.yourprice': 'Ang presyo mo', 'sheet.asked': 'hinihingi',
  'sheet.demo': 'Demo: sasagot ang mangingisda sa loob ng ilang segundo.', 'sheet.confirmbuy': 'Oo, bilhin', 'sheet.send': 'Ipadala ang alok', 'sheet.cancel': 'Hindi pa',
  'orders.title': 'Mga order mo', 'orders.active': 'Aktibo', 'orders.done': 'Tapos na', 'orders.empty': 'Wala ka pang order. Maghanap ng lote sa Mga Alok.',
  'step.confirmed': 'Nakumpirma', 'step.onway': 'Papunta', 'step.received': 'Natanggap',
  'order.waiting': 'Hinihintay ang sagot ng mangingisda…', 'order.declined': 'Hindi tinanggap ng mangingisda ang presyong ito.', 'order.tryother': 'Tingnan ang ibang alok',
  'order.go': 'Papunta na ako', 'order.got': 'Natanggap ko na ang isda', 'order.rescued': 'Naligtas na huli', 'order.total': '₱{n} kabuuan',
  'needs.title': 'Ang kailangan mo', 'needs.sub': 'Makikita ng mga mangingisdang may tugmang isda ang kailangan mo.', 'needs.new': 'Mag-post ng kailangan', 'needs.empty': 'Wala ka pang na-post na kailangan.',
  'needs.fish': 'Anong isda?', 'needs.kg': 'Ilang kilo?', 'needs.when': 'Kailan?', 'needs.max': 'Pinakamataas na presyong babayaran mo (₱/kg)', 'needs.nomax': 'Walang limit',
  'when.today': 'Ngayon', 'when.tomorrow': 'Bukas', 'when.week': 'Ngayong linggo', 'needs.post': 'I-post ang kailangan ko', 'needs.close': 'Isara ang kailangang ito', 'needs.closed': 'Sarado', 'needs.view': 'Tingnan ang tugmang lote',
  'needs.line': '{kg} kg · {when}', 'needs.upto': 'hanggang ₱{n}/kg',
  'stall.title': 'Aking Pwesto', 'stall.rescue': 'Rescue buyer', 'stall.rescue.sub': 'Ang pagbili ng isdang kailangang maibenta agad ay pumipigil na masayang ito.',
  'stall.rescue.n': '{n} sa 3 naligtas na order', 'stall.rescue.got': 'Rescue Buyer ka na!',
  'stall.stats.orders': 'Natanggap na order', 'stall.stats.kg': 'Kilong nabili', 'stall.stats.rescued': 'Kilong naligtas',
  'stall.night': 'Gabi sa dagat', 'stall.reset': 'I-reset ang demo na alok',
  'wait.title': 'Nakaangkla pa, hindi pa nakakadaong', 'wait.text': 'Sinusuri ng admin ang aplikasyon mo. Kapag naaprubahan, kusang magbubukas ang pahinang ito.',
  'wait.s1': 'Naipadala', 'wait.s2': 'Sinusuri', 'wait.s3': 'Aprubado',
  'wait.no.title': 'Hindi pa inaprubahan', 'wait.no.why': 'Dahilan', 'wait.no.fix': 'Ayusin ang detalye at ipadala ulit.', 'wait.no.send': 'Ipadala ulit', 'wait.no.fill': 'Punan ang bawat kahon.',
  'wait.ok': 'Aprubado ka na! Binubuksan ang pantalan mo…',
  who: 'Account', 'unit.kg': 'kg',
  'nav.alerts': 'Abiso',
  'alerts.title': 'Mga abiso', 'alerts.sub': 'Mga bagong lote para sa kailangan mo at balita sa mga order mo.', 'alerts.empty': 'Wala pang bago. Mag-post ng kailangan at lalabas dito ang mga tugmang lote.', 'alerts.new': 'Bago',
  'alert.match': 'Tugmang lote sa kailangan mo', 'alert.match.body': '{fisher} · {place} · ₱{ask}/kg',
  'alert.o.confirmed': 'Kumpirmado ang order', 'alert.o.onway': 'Papunta ka na', 'alert.o.received': 'Natanggap na ang isda',
  'ago.now': 'ngayon lang', 'ago.min': '{n} minuto na ang nakalipas', 'ago.hr': '{n} oras na ang nakalipas',
  'fneed.title': 'May naghahanap ng {species}', 'fneed.offer': 'Ialok ang huli ko', 'fneed.sent': 'Naialok na. Makikita na ng mamimili ang huli mo.', 'fneed.others': 'Tingnan ang ibang mamimili',  
}

export type { BKey }
const dict = { en, fil }

export function useBT() {
  const { lang } = useSettings()
  return useCallback((key: BKey, vars?: Record<string, string | number>) => {
    let s: string = dict[lang ?? 'en'][key]
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
    return s
  }, [lang])
}