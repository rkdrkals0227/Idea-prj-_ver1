export function dayPhase(date=new Date()) {
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
 const value=k=>Number(parts.find(p=>p.type===k).value),hour=value('hour')+value('minute')/60;
 const phase=hour>=6&&hour<8?'dawn':hour>=8&&hour<17?'day':hour>=17&&hour<19?'dusk':'night';
 const daylight=Math.max(0,Math.sin((hour-6)/12*Math.PI));
 return {phase,hour,light:.65+daylight*1.15,label:{dawn:'아침',day:'낮',dusk:'노을',night:'밤'}[phase],time:`${String(value('hour')).padStart(2,'0')}:${String(value('minute')).padStart(2,'0')}`};
}
export function formatDuration(ms) {
 const sec=Math.floor(Math.max(0,ms)/1000),m=Math.floor(sec/60),s=sec%60;
 return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
export class ActivityClock {
 constructor(record,now=performance.now()) {
  this.record=record;this.record.totalMs=Number.isFinite(record.totalMs)&&record.totalMs>=0?record.totalMs:0;
  this.last=now;this.active=false;this.sessionMs=0;
 }
 get totalMs(){return this.record.totalMs}
 tick(now,active) {
  const elapsed=Math.max(0,now-this.last);
  if(this.active){this.sessionMs+=elapsed;this.record.totalMs+=elapsed}
  this.last=now;this.active=!!active;
 }
}
