/**
 * LOCAL MOCK DATA — delete this whole file when the backend lands.
 *
 * Screens import from here directly. There is deliberately no service/API
 * layer: `resolveDealsForDate` is just an in-memory filter over these arrays
 * so the UI has something to render. The real app will replace this with:
 *   ZIP -> Places API (nearby branches) -> chains -> scraped deals.
 *
 * Because this is mock data, every branch is treated as "near" any valid US
 * ZIP so the demo always populates. Proximity filtering is a backend concern.
 */

import { Branch, Chain, Deal, ResolvedDeal, Weekday } from './types';

const SUN = 0,
  MON = 1,
  TUE = 2,
  WED = 3,
  THU = 4,
  FRI = 5,
  SAT = 6;

export const CHAINS: Chain[] = [
  { id: 'applebees', name: "Applebee's", emoji: '🍎', accent: '#E4322B' },
  { id: 'moes', name: "Moe's Southwest Grill", emoji: '🌯', accent: '#E4572E' },
  { id: 'cactus', name: 'Cactus Cafe', emoji: '🌵', accent: '#2E9E5B' },
  { id: 'bww', name: 'Buffalo Wild Wings', emoji: '🍗', accent: '#F2A900' },
  { id: 'chilis', name: "Chili's", emoji: '🌶️', accent: '#C8102E' },
  { id: 'ihop', name: 'IHOP', emoji: '🥞', accent: '#0072CE' },
  { id: 'dennys', name: "Denny's", emoji: '🍳', accent: '#D81E05' },
  { id: 'panera', name: 'Panera Bread', emoji: '🥖', accent: '#6B8E23' },
  { id: 'tacotime', name: 'Taco Fiesta', emoji: '🌮', accent: '#F4A300' },
  { id: 'scoops', name: 'Scoops Creamery', emoji: '🍦', accent: '#F49AC2' },
];

export const BRANCHES: Branch[] = [
  { id: 'b-applebees', chainId: 'applebees', name: "Applebee's — Midtown", zip: '10001', distanceMiles: 0.8 },
  { id: 'b-moes', chainId: 'moes', name: "Moe's — 5th & Main", zip: '10001', distanceMiles: 1.2 },
  { id: 'b-cactus', chainId: 'cactus', name: 'Cactus Cafe — Riverside', zip: '10002', distanceMiles: 1.6 },
  { id: 'b-bww', chainId: 'bww', name: 'Buffalo Wild Wings — Stadium', zip: '10001', distanceMiles: 2.1 },
  { id: 'b-chilis', chainId: 'chilis', name: "Chili's — Westgate", zip: '10003', distanceMiles: 2.4 },
  { id: 'b-ihop', chainId: 'ihop', name: 'IHOP — Sunrise Blvd', zip: '10002', distanceMiles: 0.5 },
  { id: 'b-dennys', chainId: 'dennys', name: "Denny's — Route 9", zip: '10003', distanceMiles: 3.0 },
  { id: 'b-panera', chainId: 'panera', name: 'Panera — City Center', zip: '10001', distanceMiles: 0.9 },
  { id: 'b-tacotime', chainId: 'tacotime', name: 'Taco Fiesta — Market St', zip: '10002', distanceMiles: 1.1 },
  { id: 'b-scoops', chainId: 'scoops', name: 'Scoops — Boardwalk', zip: '10001', distanceMiles: 1.4 },
];

export const DEALS: Deal[] = [
  // Applebee's — half-price apps, late window, most nights
  {
    id: 'd-applebees-apps',
    chainId: 'applebees',
    title: 'Half-Price Apps',
    description: 'Every appetizer on the menu, 50% off during the late-night window.',
    daysOfWeek: [MON, TUE, WED, THU, SUN] as Weekday[],
    startTime: '21:00',
    endTime: '23:59',
    requiresRewards: false,
  },
  // Moe Monday — all day, day-specific
  {
    id: 'd-moe-monday',
    chainId: 'moes',
    title: 'Moe Monday',
    description: 'Burrito, chips & a drink for one low price. All day, every Monday.',
    daysOfWeek: [MON] as Weekday[],
    startTime: null,
    endTime: null,
    requiresRewards: false,
  },
  // Cactus Cafe — burritos half off after 10pm
  {
    id: 'd-cactus-latenight',
    chainId: 'cactus',
    title: 'Burritos Half Off',
    description: 'Every burrito is 50% off after 10pm. Night owls only.',
    daysOfWeek: [THU, FRI, SAT] as Weekday[],
    startTime: '22:00',
    endTime: '23:59',
    requiresRewards: false,
  },
  // Buffalo Wild Wings — Wing Tuesday
  {
    id: 'd-bww-tuesday',
    chainId: 'bww',
    title: 'Wing Tuesday',
    description: 'Boneless wings at the classic Tuesday price. Dine-in & takeout.',
    daysOfWeek: [TUE] as Weekday[],
    startTime: '11:00',
    endTime: '23:00',
    requiresRewards: true,
  },
  // Chili's — 3 for me, all day weekdays, rewards
  {
    id: 'd-chilis-3formeals',
    chainId: 'chilis',
    title: '3 for Me',
    description: 'Drink, appetizer & entrée in one combo. Members save extra.',
    daysOfWeek: [MON, TUE, WED, THU, FRI] as Weekday[],
    startTime: null,
    endTime: null,
    requiresRewards: true,
  },
  // IHOP — 55+ short stack breakfast window
  {
    id: 'd-ihop-morning',
    chainId: 'ihop',
    title: 'Rooty Tooty Breakfast',
    description: 'Two eggs, two pancakes, two of everything — morning window only.',
    daysOfWeek: [SAT, SUN] as Weekday[],
    startTime: '07:00',
    endTime: '11:00',
    requiresRewards: false,
  },
  // Denny's — build your own grand slam, late night
  {
    id: 'd-dennys-latenight',
    chainId: 'dennys',
    title: 'Late Night Slam',
    description: 'Build-your-own Grand Slam at the after-dark price.',
    daysOfWeek: [FRI, SAT] as Weekday[],
    startTime: '00:00',
    endTime: '05:00',
    requiresRewards: false,
  },
  // Panera — free coffee for members, all day
  {
    id: 'd-panera-coffee',
    chainId: 'panera',
    title: 'Unlimited Sip Club',
    description: 'Any size hot or iced coffee, free for members. All day.',
    daysOfWeek: [MON, TUE, WED, THU, FRI, SAT, SUN] as Weekday[],
    startTime: null,
    endTime: null,
    requiresRewards: true,
  },
  // Taco Fiesta — taco happy hour
  {
    id: 'd-taco-happyhour',
    chainId: 'tacotime',
    title: 'Taco Happy Hour',
    description: 'Street tacos at happy-hour pricing in the afternoon lull.',
    daysOfWeek: [WED, THU, FRI] as Weekday[],
    startTime: '15:00',
    endTime: '18:00',
    requiresRewards: false,
  },
  // Scoops — Sundae Sunday
  {
    id: 'd-scoops-sunday',
    chainId: 'scoops',
    title: 'Sundae Sunday',
    description: 'Buy one sundae, get one free. Bring a friend.',
    daysOfWeek: [SUN] as Weekday[],
    startTime: '12:00',
    endTime: '21:00',
    requiresRewards: false,
  },
  // Taco Fiesta — Taco Tuesday all day (adds density to Tuesdays)
  {
    id: 'd-taco-tuesday',
    chainId: 'tacotime',
    title: 'Taco Tuesday',
    description: '$1 tacos all day long. The original and the best.',
    daysOfWeek: [TUE] as Weekday[],
    startTime: null,
    endTime: null,
    requiresRewards: false,
  },
];

const chainById = new Map(CHAINS.map((c) => [c.id, c]));
const branchByChainId = new Map(BRANCHES.map((b) => [b.chainId, b]));

/**
 * Local, synchronous resolver over the mock arrays. Not a service call.
 *
 * @param date A JS Date for the day being viewed.
 * @param _zip The user's ZIP (unused in mock — proximity is a backend job).
 * @returns Deals active on that weekday, joined to chain + branch,
 *          sorted by start time (all-day deals first).
 */
export function resolveDealsForDate(date: Date, _zip: string): ResolvedDeal[] {
  const weekday = date.getDay() as Weekday;

  return DEALS.filter((deal) => deal.daysOfWeek.includes(weekday))
    .map((deal) => {
      const chain = chainById.get(deal.chainId)!;
      const branch = branchByChainId.get(deal.chainId)!;
      return { deal, chain, branch };
    })
    .sort((a, b) => {
      // All-day (null startTime) sorts to the top; otherwise by clock time.
      const at = a.deal.startTime ?? '';
      const bt = b.deal.startTime ?? '';
      if (at === bt) return 0;
      if (at === '') return -1;
      if (bt === '') return 1;
      return at < bt ? -1 : 1;
    });
}

/** Which weekdays (0–6) have at least one deal — used to dot the calendar. */
export function weekdaysWithDeals(): Set<Weekday> {
  const set = new Set<Weekday>();
  for (const deal of DEALS) for (const d of deal.daysOfWeek) set.add(d);
  return set;
}
