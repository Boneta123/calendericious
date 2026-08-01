/**
 * DealDay design tokens — "the deal almanac"
 * Cream menu-paper canvas, appetizing tomato/mustard, basil for all-day,
 * grape for rewards. Times & ZIP speak in monospace (the receipt voice).
 */

export const colors = {
  paper: '#FFF6EC',      // app background — warm menu paper
  paperDeep: '#F6E9D6',  // recessed panels / calendar body
  card: '#FFFFFF',       // coupon body
  ink: '#2B1B2E',        // primary text — plum-black
  inkSoft: '#7A6A70',    // secondary text
  inkFaint: '#B7A9AE',   // disabled / faint

  tomato: '#FF5A36',     // primary action
  tomatoDeep: '#E64420', // pressed
  tomatoWash: '#FFE7DF', // tomato tint fill

  mustard: '#FFC24B',    // accent / highlight
  mustardWash: '#FFF2D4',

  basil: '#3DA35D',      // all-day deals / success
  basilWash: '#E4F3E8',

  grape: '#6C4AB6',      // rewards
  grapeWash: '#EFE8F8',

  line: '#EBDCC7',       // borders, perforation dashes
  overlay: 'rgba(43, 27, 46, 0.45)',
} as const;

export const fonts = {
  display: 'Baloo2_800ExtraBold',
  displaySemi: 'Baloo2_600SemiBold',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_800ExtraBold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#2B1B2E',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  soft: {
    shadowColor: '#2B1B2E',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
} as const;

export const theme = { colors, fonts, spacing, radii, shadow };
export type Theme = typeof theme;
