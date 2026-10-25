import {initialState} from './logic.js';
// A page load starts a new learner's run; only presentation preferences carry over.
export function freshRun(previous){
 const next=initialState(),s=previous?.settings||{},defaults=next.settings;
 next.settings={
  quality:['normal','low'].includes(s.quality)?s.quality:defaults.quality,
  font:[1,1.15,1.3].includes(Number(s.font))?Number(s.font):defaults.font,
  motion:s.motion===true,sound:s.sound===true,
  artLimit:[5,15,30].includes(Number(s.artLimit))?Number(s.artLimit):defaults.artLimit,
  displayName:['creature','alias'].includes(s.displayName)?s.displayName:defaults.displayName,
 };
 return next;
}
