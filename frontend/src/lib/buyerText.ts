import { useCallback } from 'react'
import { useSettings } from './settings'

// Words for the buyer side. Add a line to BOTH lists when you add a word.
const en = {
  sample: 'sample',

  // Navigation
  'nav.home': 'Home', 'nav.pantalan': 'Pier', 'nav.offers': 'Offers', 'nav.needs': 'My needs', 'nav.orders': 'Orders', 'nav.stall': 'My stall', 'nav.need': 'I need',
  'nav.alerts': 'Alerts',

  // Common words
  'c.all': 'All', 'c.active': 'Active', 'c.done': 'Done', 'c.cancelled': 'Cancelled', 'c.open': 'Open', 'c.closed': 'Closed',
  'c.accepted': 'Accepted', 'c.declined': 'Declined', 'c.accept': 'Accept', 'c.decline': 'Decline', 'c.seeall': 'See all',
  'c.from': 'from {name}', 'c.total': 'Total ₱{n}', 'c.perkg': '₱{n}/kg', 'c.kg': '{n} kg', 'c.address': 'Address',
  'unit.kg': 'kg', who: 'Account',

  // Home
  'home.hello': 'Hello', 'home.sub': 'Fresh fish from nearby fisherfolk',
  'home.stat.active': 'Active orders', 'home.stat.needs': 'Open needs', 'home.stat.kg': 'Kilos bought', 'home.stat.spent': 'Spent this month',
  'home.quick': 'Quick actions', 'home.q.browse': 'Find fish', 'home.q.need': 'Post a need', 'home.q.orders': 'My orders', 'home.q.stall': 'My stall',
  'home.recent': 'Recent', 'home.recent.empty': 'Nothing yet. Find fish or post a need.',
  'home.row.order': 'Order', 'home.row.need': 'Need',
  'home.tide.hint': 'Buoys sink as time runs out. Buy the lowest ones first.', 'home.hours.left': '{n}h left',
  'home.stat.open': 'Fish for sale', 'home.stat.onway': 'On the way', 'home.stat.rescue': 'Saved',
  'home.urgent': 'Sell-soon fish', 'home.urgent.sub': 'These need a buyer first', 'home.seeall': 'See all offers',
  'home.needs': 'What you need', 'home.needs.none': 'Post what you need. Matching fish will show here.', 'home.needs.add': 'Post a need',
  'home.needs.match': '{n} matches', 'home.needs.nomatch': 'No match yet',
  'home.orders': 'Orders in progress', 'home.empty': 'No fish for sale right now.',

  // Home dashboard
  'bh.loading': 'Loading…', 'bh.caught': 'You are all caught up.',
  'bh.status.offers': 'Offers to answer: {n}', 'bh.status.orders': 'Orders confirmed: {n}',
  'bh.offers.title': 'Offers to answer', 'bh.offers.sub': 'Replies to your needs', 'bh.offers.empty': 'No offers waiting.',
  'bh.more': '+{n} more', 'bh.orders.empty': 'No active orders.', 'bh.needs.empty': 'Nothing posted yet.',
  'bh.waiting': 'Waiting', 'bh.offers.n': 'Offers: {n}',
  'bh.month': 'This month', 'bh.spent': 'Spent', 'bh.received': 'Received', 'bh.donecount': 'Orders done',

  // Pier (browse fish)
  'pier.sub': 'Fresh catch near you', 'pier.search': 'Search fish or place',
  'pier.species': 'Fish', 'pier.allspecies': 'All fish', 'pier.place': 'Place', 'pier.allplaces': 'All places',
  'pier.price': 'Price', 'pier.anyprice': 'Any price', 'pier.upto': 'Up to ₱{n}/kg',
  'pier.sort': 'Sort', 'sort.newest': 'Newest',
  'pier.empty': 'No fish found. Try a different filter.', 'pier.kgleft': '{n} kg available', 'pier.view': 'View offer',
  'pier.save': 'Save this catch', 'pier.unsave': 'Remove from saved', 'badge.new': 'New',

  // Offers
  'offers.title': 'Offers', 'offers.sub': 'Prices fisherfolk sent you',
  'offers.all': 'All fish', 'offers.sort': 'Sort', 'sort.urgent': 'Most urgent', 'sort.price': 'Lowest price', 'sort.size': 'Biggest catch',
  'offers.empty': 'No offers here yet. Post a need and fisherfolk will reply.',
  'offer.rescue': 'Sell soon', 'offer.fresh': 'Fresh', 'offer.match': 'Fits what you need', 'offer.total': 'Total ₱{n}',
  'offer.buy': 'Buy now', 'offer.counter': 'Offer a price',
  'fair.title': 'Price', 'fair.low': 'below usual', 'fair.usual': 'about usual', 'fair.high': 'above usual', 'fair.usual.price': 'usual ₱{n}',
  'sheet.buy': 'Buy this catch?', 'sheet.counter': 'Offer your price', 'sheet.yourprice': 'Your price', 'sheet.asked': 'asked',
  'sheet.demo': 'Demo: the fisher answers in a few seconds.', 'sheet.confirmbuy': 'Yes, buy it', 'sheet.send': 'Send my offer', 'sheet.cancel': 'Not yet',

  // Orders
  'orders.title': 'Your orders', 'orders.sub': 'Your purchases', 'orders.active': 'Active', 'orders.done': 'Done', 'orders.empty': 'No orders yet. Find fish at the Pier.',
  'step.confirmed': 'Confirmed', 'step.onway': 'On the way', 'step.received': 'Received',
  'order.waiting': 'Waiting for the fisher’s answer…', 'order.declined': 'The fisher did not accept this price.', 'order.tryother': 'See other offers',
  'order.go': 'I am on my way', 'order.got': 'I received the fish', 'order.rescued': 'Saved catch', 'order.total': '₱{n} total',
  'order.confirmed.note': '{fisher} will mark this done when you get the fish.',

  // Needs
  'needs.title': 'My needs', 'needs.sub': 'Fisherfolk with matching fish will see this.', 'needs.new': 'Post a need', 'needs.empty': 'No needs yet.',
  'needs.fish': 'Which fish?', 'needs.kg': 'How many kilos?', 'needs.when': 'When?', 'needs.max': 'Highest price (₱/kg)', 'needs.nomax': 'No limit',
  'when.today': 'Today', 'when.tomorrow': 'Tomorrow', 'when.week': 'This week', 'needs.post': 'Post my need', 'needs.close': 'Close', 'needs.closed': 'Closed', 'needs.view': 'See matches',
  'needs.line': '{kg} kg · {when}', 'needs.upto': 'up to ₱{n}/kg',
  'needs.waiting': 'Offers for you', 'needs.maxprice': 'Max price', 'needs.tab.empty': 'Nothing here yet.', 'needs.where': 'Where are you?',
  'needs.fresh': 'Spoilage risk: {r}', 'needs.accepted.note': 'Accepted from {fisher}. See Orders.',
  'needs.err.answer': 'Could not answer the offer.', 'needs.err.post': 'Could not post your need.',

  // My stall
  'stall.title': 'My stall', 'stall.info': 'My details', 'stall.rescue': 'Rescue buyer', 'stall.rescue.sub': 'Buy fish that must sell soon so they are not wasted.',
  'stall.rescue.n': '{n} of 3 saved orders', 'stall.rescue.got': 'You are a Rescue Buyer!',
  'stall.stats.orders': 'Orders received', 'stall.stats.kg': 'Kilos bought', 'stall.stats.rescued': 'Kilos saved',
  'stall.night': 'Night mode', 'stall.reset': 'Reset demo offers', 'stall.settings': 'Settings',

  // Waiting for approval
  'wait.title': 'Waiting for approval', 'wait.text': 'We are checking your details. This page opens when you are approved.',
  'wait.s1': 'Sent', 'wait.s2': 'Checking', 'wait.s3': 'Approved',
  'wait.no.title': 'Not approved yet', 'wait.no.why': 'Why', 'wait.no.fix': 'Fix your details and send again.', 'wait.no.send': 'Send again', 'wait.no.fill': 'Fill in every box.',
  'wait.ok': 'You are approved! Opening your pier…',

  // Alerts
  'alerts.title': 'Alerts', 'alerts.sub': 'New matches and order news.', 'alerts.empty': 'Nothing new. Post a need and matches will show here.', 'alerts.new': 'New',
  'alert.match': 'Catch that fits your need', 'alert.match.body': '{fisher} · {place} · ₱{ask}/kg',
  'alert.offer': 'New offer for your need', 'alert.offer.body': '{fisher} offers ₱{price}/kg · {place}',
  'alert.o.confirmed': 'Order confirmed', 'alert.o.onway': 'You are on the way', 'alert.o.received': 'Fish received',
  'ago.now': 'just now', 'ago.min': '{n} min ago', 'ago.hr': '{n} h ago',
  'fneed.title': 'Someone is looking for {species}', 'fneed.offer': 'Offer my catch', 'fneed.sent': 'Offered. The buyer can see your catch now.', 'fneed.others': 'See other buyers',

  // Settings
  'bset.reset.hint': 'Puts the sample offers back the way they started.', 'bset.reset.done': 'Demo offers reset',
} as const

type BKey = keyof typeof en
const fil: Record<BKey, string> = {
  sample: 'halimbawa',

  'nav.home': 'Home', 'nav.pantalan': 'Pantalan', 'nav.offers': 'Alok', 'nav.needs': 'Kailangan', 'nav.orders': 'Order', 'nav.stall': 'Pwesto', 'nav.need': 'Kailangan ko',
  'nav.alerts': 'Abiso',

  'c.all': 'Lahat', 'c.active': 'Aktibo', 'c.done': 'Tapos na', 'c.cancelled': 'Kanselado', 'c.open': 'Bukas', 'c.closed': 'Sarado',
  'c.accepted': 'Tinanggap', 'c.declined': 'Tinanggihan', 'c.accept': 'Tanggapin', 'c.decline': 'Tanggihan', 'c.seeall': 'Tingnan lahat',
  'c.from': 'mula kay {name}', 'c.total': 'Kabuuan ₱{n}', 'c.perkg': '₱{n}/kg', 'c.kg': '{n} kg', 'c.address': 'Tirahan',
  'unit.kg': 'kg', who: 'Account',

  'home.hello': 'Kumusta', 'home.sub': 'Sariwang isda mula sa mga mangingisda malapit sa iyo',
  'home.stat.active': 'Mga aktibong order', 'home.stat.needs': 'Bukas na kailangan', 'home.stat.kg': 'Kilong nabili', 'home.stat.spent': 'Nagastos ngayong buwan',
  'home.quick': 'Mabilis na gawin', 'home.q.browse': 'Maghanap ng isda', 'home.q.need': 'Mag-post ng kailangan', 'home.q.orders': 'Mga order ko', 'home.q.stall': 'Pwesto ko',
  'home.recent': 'Kamakailan', 'home.recent.empty': 'Wala pa. Maghanap ng isda o mag-post ng kailangan.',
  'home.row.order': 'Order', 'home.row.need': 'Kailangan',
  'home.tide.hint': 'Lumulubog ang boya habang nauubos ang oras. Unahin ang pinakamababa.', 'home.hours.left': '{n} oras na lang',
  'home.stat.open': 'Isdang ibinebenta', 'home.stat.onway': 'Papunta na', 'home.stat.rescue': 'Naligtas',
  'home.urgent': 'Dapat maibenta agad', 'home.urgent.sub': 'Ito ang unang kailangang mabili', 'home.seeall': 'Tingnan ang lahat ng alok',
  'home.needs': 'Ang kailangan mo', 'home.needs.none': 'I-post ang kailangan mo. Lalabas dito ang mga isdang tugma.', 'home.needs.add': 'Mag-post ng kailangan',
  'home.needs.match': '{n} tugma', 'home.needs.nomatch': 'Wala pang tugma',
  'home.orders': 'Mga order na isinasagawa', 'home.empty': 'Walang isdang ibinebenta ngayon.',

  'bh.loading': 'Sandali lang…', 'bh.caught': 'Wala ka nang kailangang gawin.',
  'bh.status.offers': 'Alok na sasagutin: {n}', 'bh.status.orders': 'Kumpirmadong order: {n}',
  'bh.offers.title': 'Mga alok na sasagutin', 'bh.offers.sub': 'Mga sagot sa kailangan mo', 'bh.offers.empty': 'Walang alok na naghihintay.',
  'bh.more': '+{n} pa', 'bh.orders.empty': 'Walang aktibong order.', 'bh.needs.empty': 'Wala pang na-post.',
  'bh.waiting': 'Naghihintay', 'bh.offers.n': 'Alok: {n}',
  'bh.month': 'Ngayong buwan', 'bh.spent': 'Nagastos', 'bh.received': 'Natanggap', 'bh.donecount': 'Tapos na order',

  'pier.sub': 'Sariwang isda malapit sa iyo', 'pier.search': 'Hanapin ang isda o lugar',
  'pier.species': 'Isda', 'pier.allspecies': 'Lahat ng isda', 'pier.place': 'Lugar', 'pier.allplaces': 'Lahat ng lugar',
  'pier.price': 'Presyo', 'pier.anyprice': 'Kahit magkano', 'pier.upto': 'Hanggang ₱{n}/kg',
  'pier.sort': 'Ayusin', 'sort.newest': 'Pinakabago',
  'pier.empty': 'Walang nahanap na isda. Subukan ang ibang filter.', 'pier.kgleft': '{n} kg ang available', 'pier.view': 'Tingnan ang alok',
  'pier.save': 'I-save ang isdang ito', 'pier.unsave': 'Alisin sa mga naka-save', 'badge.new': 'Bago',

  'offers.title': 'Mga Alok', 'offers.sub': 'Mga alok ng mangingisda sa iyo',
  'offers.all': 'Lahat ng isda', 'offers.sort': 'Ayusin', 'sort.urgent': 'Dapat unahin', 'sort.price': 'Pinakamura', 'sort.size': 'Pinakamarami',
  'offers.empty': 'Wala pang alok dito. Mag-post ng kailangan at sasagot ang mga mangingisda.',
  'offer.rescue': 'Dapat maibenta agad', 'offer.fresh': 'Sariwa', 'offer.match': 'Akma sa kailangan mo', 'offer.total': 'Kabuuan ₱{n}',
  'offer.buy': 'Bilhin na', 'offer.counter': 'Mag-alok ng presyo',
  'fair.title': 'Presyo', 'fair.low': 'mas mura kaysa karaniwan', 'fair.usual': 'karaniwang presyo', 'fair.high': 'mas mahal kaysa karaniwan', 'fair.usual.price': 'karaniwan ₱{n}',
  'sheet.buy': 'Bibilhin mo ba ito?', 'sheet.counter': 'Mag-alok ng presyo', 'sheet.yourprice': 'Presyo mo', 'sheet.asked': 'hinihingi',
  'sheet.demo': 'Demo lang: sasagot ang mangingisda sa loob ng ilang segundo.', 'sheet.confirmbuy': 'Oo, bilhin', 'sheet.send': 'Ipadala ang alok', 'sheet.cancel': 'Huwag muna',

  'orders.title': 'Mga order mo', 'orders.sub': 'Mga binili mo', 'orders.active': 'Aktibo', 'orders.done': 'Tapos na', 'orders.empty': 'Wala ka pang order. Maghanap ng isda sa Pantalan.',
  'step.confirmed': 'Kumpirmado', 'step.onway': 'Papunta', 'step.received': 'Natanggap',
  'order.waiting': 'Hinihintay ang sagot ng mangingisda…', 'order.declined': 'Hindi tinanggap ng mangingisda ang presyo.', 'order.tryother': 'Tingnan ang ibang alok',
  'order.go': 'Papunta na ako', 'order.got': 'Natanggap ko na ang isda', 'order.rescued': 'Naligtas na isda', 'order.total': '₱{n} kabuuan',
  'order.confirmed.note': 'Mamarkahan ni {fisher} na tapos na ito kapag natanggap mo na ang isda.',

  'needs.title': 'Kailangan ko', 'needs.sub': 'Makikita ito ng mga mangingisdang may ganitong isda.', 'needs.new': 'Mag-post ng kailangan', 'needs.empty': 'Wala ka pang na-post na kailangan.',
  'needs.fish': 'Anong isda?', 'needs.kg': 'Ilang kilo?', 'needs.when': 'Kailan?', 'needs.max': 'Pinakamataas na presyo (₱/kg)', 'needs.nomax': 'Walang limit',
  'when.today': 'Ngayon', 'when.tomorrow': 'Bukas', 'when.week': 'Ngayong linggo', 'needs.post': 'I-post ang kailangan ko', 'needs.close': 'Isara', 'needs.closed': 'Sarado', 'needs.view': 'Tingnan ang tugma',
  'needs.line': '{kg} kg · {when}', 'needs.upto': 'hanggang ₱{n}/kg',
  'needs.waiting': 'Mga alok para sa iyo', 'needs.maxprice': 'Pinakamataas na presyo', 'needs.tab.empty': 'Wala pa rito.', 'needs.where': 'Nasaan ka?',
  'needs.fresh': 'Panganib na masira: {r}', 'needs.accepted.note': 'Tinanggap mula kay {fisher}. Tingnan sa Mga Order.',
  'needs.err.answer': 'Hindi nasagot ang alok. Subukan ulit.', 'needs.err.post': 'Hindi na-post ang kailangan mo. Subukan ulit.',

  'stall.title': 'Pwesto Ko', 'stall.info': 'Detalye ko', 'stall.rescue': 'Tagapagligtas ng isda', 'stall.rescue.sub': 'Bilhin ang isdang dapat maibenta agad para hindi masayang.',
  'stall.rescue.n': '{n} sa 3 naligtas na order', 'stall.rescue.got': 'Tagapagligtas ka na ng isda!',
  'stall.stats.orders': 'Natanggap na order', 'stall.stats.kg': 'Kilong nabili', 'stall.stats.rescued': 'Kilong naligtas',
  'stall.night': 'Madilim na tema', 'stall.reset': 'I-reset ang demo na alok', 'stall.settings': 'Setting',

  'wait.title': 'Hinihintay ang pag-apruba', 'wait.text': 'Sinusuri pa namin ang detalye mo. Magbubukas ang pahinang ito kapag aprubado ka na.',
  'wait.s1': 'Naipadala', 'wait.s2': 'Sinusuri', 'wait.s3': 'Aprubado',
  'wait.no.title': 'Hindi pa naaprubahan', 'wait.no.why': 'Dahilan', 'wait.no.fix': 'Ayusin ang detalye at ipadala ulit.', 'wait.no.send': 'Ipadala ulit', 'wait.no.fill': 'Punan ang lahat ng kahon.',
  'wait.ok': 'Aprubado ka na! Binubuksan ang Pantalan…',

  'alerts.title': 'Mga abiso', 'alerts.sub': 'Mga bagong tugma at balita sa order mo.', 'alerts.empty': 'Wala pang bago. Mag-post ng kailangan at lalabas dito ang mga tugma.', 'alerts.new': 'Bago',
  'alert.match': 'May isdang akma sa kailangan mo', 'alert.match.body': '{fisher} · {place} · ₱{ask}/kg',
  'alert.offer': 'May bagong alok sa kailangan mo', 'alert.offer.body': 'Nag-aalok si {fisher} ng ₱{price}/kg · {place}',
  'alert.o.confirmed': 'Kumpirmado na ang order', 'alert.o.onway': 'Papunta ka na', 'alert.o.received': 'Natanggap na ang isda',
  'ago.now': 'ngayon lang', 'ago.min': '{n} min ang nakalipas', 'ago.hr': '{n} oras ang nakalipas',
  'fneed.title': 'May naghahanap ng {species}', 'fneed.offer': 'Ialok ang isda ko', 'fneed.sent': 'Naialok na. Makikita na ng mamimili ang isda mo.', 'fneed.others': 'Tingnan ang ibang mamimili',

  'bset.reset.hint': 'Ibabalik ang mga sample na alok sa dati nilang ayos.', 'bset.reset.done': 'Na-reset na ang mga demo na alok',
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