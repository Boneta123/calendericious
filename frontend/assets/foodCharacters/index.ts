/**
 * Food-character asset registry.
 *
 * Metro can only bundle images referenced by STATIC require() paths, so every
 * asset is required here once and imported by name elsewhere. Add new
 * characters to CHARACTERS to have them flow into the scatter automatically.
 */

import { ImageSourcePropType } from 'react-native';

export const BRAND_LOGO: ImageSourcePropType = require('./calendericiousLogo.png');

/** The group shot — five breakfast pals. Used as auth hero + empty states. */
export const FOOD_FRIENDS: ImageSourcePropType = require('./breakfastBuddies.png');

/** Shown on the day-detail empty state when there are no deals. */
export const NO_DEALS: ImageSourcePropType = require('./noDeals.png');

/** Individual mascots, reused across the scattered background. */
export const CHARACTERS: ImageSourcePropType[] = [
  require('./boba.png'),
  require('./burger.png'),
  require('./crossaint.png'),
  require('./pizza.png'),
  require('./taco.png'),
  require('./Gemini_Generated_Image_2ydhrk2ydhrk2ydh-Picsart-BackgroundRemover.png'), // sushi
];
