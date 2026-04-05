// ================================================================
//  DASH BLITZ — Character catalog
// ================================================================
import Apple   from './apple.js';
import SodaCan from './sodacan.js';
import Donut   from './donut.js';
import Sushi   from './sushi.js';
import RiceBox from './ricebox.js';

export const CHARACTERS = [
  { id: 'apple',   name: 'Apple',    Class: Apple,   cost: 0,   unlocked: true  },
  { id: 'sodacan', name: 'Soda Can', Class: SodaCan, cost: 50,  unlocked: false },
  { id: 'donut',   name: 'Donut',    Class: Donut,   cost: 150, unlocked: false },
  { id: 'sushi',   name: 'Sushi',    Class: Sushi,   cost: 300, unlocked: false },
  { id: 'ricebox', name: 'Rice Box', Class: RiceBox, cost: 500, unlocked: false },
];

export { Apple, SodaCan, Donut, Sushi, RiceBox };
