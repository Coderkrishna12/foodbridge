import {
  Award, Box, ChefHat, Container, Flame, Milk, Nut, Package, Snowflake, Sparkles, Sprout, Utensils, Wheat, Egg, Flower2,
} from 'lucide-react';

// Keep keys in sync with server/src/models/Listing.js
export const PACKAGING = {
  individual: { label: 'Individually packed', icon: Package, hint: 'Ready to hand out' },
  containers: { label: 'In containers', icon: Container, hint: 'Sealed boxes / dabbas' },
  'foil-trays': { label: 'Foil trays', icon: Box, hint: 'Large covered trays' },
  bulk: { label: 'Bulk / bring containers', icon: Utensils, hint: 'NGO must bring vessels' },
};

export const PREPARATION = {
  'freshly-cooked': { label: 'Freshly cooked', icon: Flame },
  'cooked-today': { label: 'Cooked today', icon: ChefHat },
  refrigerated: { label: 'Refrigerated', icon: Snowflake },
  'ready-to-eat': { label: 'Ready to eat', icon: Sparkles },
  'needs-reheating': { label: 'Needs reheating', icon: Flame },
  'fssai-kitchen': { label: 'FSSAI-registered kitchen', icon: Award },
};

export const DIETARY = {
  jain: { label: 'Jain', icon: Flower2 },
  'no-onion-garlic': { label: 'No onion / garlic', icon: Sprout },
  eggless: { label: 'Eggless', icon: Egg },
  'contains-nuts': { label: 'Contains nuts', icon: Nut, warn: true },
  'contains-dairy': { label: 'Contains dairy', icon: Milk, warn: true },
  'contains-gluten': { label: 'Contains gluten', icon: Wheat, warn: true },
  spicy: { label: 'Spicy', icon: Flame, warn: true },
};

// Flatten a listing's badges into [{ key, label, icon, kind }] for display
export function listingBadges(l) {
  const out = [];
  if (l.packaging && PACKAGING[l.packaging]) out.push({ key: l.packaging, ...PACKAGING[l.packaging], kind: 'pack' });
  (l.preparation || []).forEach((k) => PREPARATION[k] && out.push({ key: k, ...PREPARATION[k], kind: 'prep' }));
  (l.dietary || []).forEach((k) => DIETARY[k] && out.push({ key: k, ...DIETARY[k], kind: DIETARY[k].warn ? 'warn' : 'diet' }));
  return out;
}

