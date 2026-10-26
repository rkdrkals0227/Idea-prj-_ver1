// One continuous original loop; short effects are synthesized locally with Web Audio.
export class VillageAudio {
 constructor({baseUrl='./',report=()=>{},changed=()=>{}}={}){
  this.baseUrl=baseUrl;this.report=report;this.changed=changed;this.settings={sound:true,musicVolume:.4,effectsVolume:.65};
  this.context=null;this.source=null;this.loading=null;this.status='시작 버튼을 누르면 음악이 나와요';this.last=new Map();
 }
 configure(settings){
  this.settings={...this.settings,...settings};
  if(!this.context){if(!settings.sound)this.setStatus('소리를 껐어요');return}
  const now=this.context.currentTime;
  this.musicGain.gain.setTargetAtTime(this.settings.musicVolume,now,.035);
  this.effectsGain.gain.setTargetAtTime(this.settings.effectsVolume,now,.035);
  this.master.gain.setTargetAtTime(this.settings.sound?1:0,now,.025);
  if(!settings.sound){this.context.suspend().catch(()=>{});this.setStatus('소리를 껐어요')}
 }
 setStatus(value){this.status=value;this.changed(value)}
 async unlock(){
  if(!this.settings.sound||document.hidden)return;
  try{
   if(!this.context){
    const Context=window.AudioContext||window.webkitAudioContext;
    this.context=new Context();this.master=this.context.createGain();this.musicGain=this.context.createGain();this.effectsGain=this.context.createGain();
    this.musicGain.connect(this.master);this.effectsGain.connect(this.master);this.master.connect(this.context.destination);this.configure(this.settings);
   }
   await this.context.resume();
   if(!this.source)await this.loadMusic();
   else this.setStatus('마을 음악이 흐르고 있어요');
  }catch{this.setStatus('소리를 시작하지 못했어요 · 다시 켜기를 눌러 주세요');this.report('소리를 켜지 못했어요. 설정에서 ‘소리 다시 켜기’를 눌러 주세요. 무음으로도 계속 탐험할 수 있어요.')}
 }
 async loadMusic(){
  if(this.source)return;
  if(this.loading){await this.loading.catch(()=>{});return}
  this.setStatus('마을 음악을 불러오고 있어요…');
  this.loading=(async()=>{
   let buffer;
   for(const extension of ['ogg','wav']){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
    try{
     const response=await fetch(`${this.baseUrl}audio/village-day.${extension}`,{signal:controller.signal});
     if(!response.ok)throw Error('Audio request failed');
     buffer=await this.context.decodeAudioData(await response.arrayBuffer());break;
    }catch{/* A local WAV fallback also supports browsers without Ogg decoding. */}
    finally{clearTimeout(timeout)}
   }
   if(!buffer)throw Error('Music unavailable');
   if(this.source)return;
   const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.musicGain);source.start();this.source=source;
   this.setStatus(this.settings.sound?'마을 음악이 흐르고 있어요':'소리를 껐어요');
  })();
  try{await this.loading}catch{this.setStatus('음악 파일을 읽지 못했어요 · 다시 켜기로 재시도해요');this.report('배경음악을 읽지 못했어요. 인터넷 연결을 확인하고 설정에서 ‘소리 다시 켜기’를 눌러 주세요. 효과음과 게임은 계속 사용할 수 있어요.')}
  finally{this.loading=null}
 }
 visibility(){
  if(!this.context)return;
  if(document.hidden)this.context.suspend().catch(()=>{});
  else if(this.settings.sound)this.unlock();
 }
 tone(frequency,time,duration,volume,type='sine',to=frequency){
  const ctx=this.context,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,time);osc.frequency.exponentialRampToValueAtTime(Math.max(to,1),time+duration);
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  osc.connect(gain);gain.connect(this.effectsGain);osc.start(time);osc.stop(time+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect()};
 }
 noise(time,duration,volume,frequency,kind='bandpass'){
  const ctx=this.context,length=Math.ceil(ctx.sampleRate*duration),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/length)*Math.exp(-i/length*3);
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=buffer;filter.type=kind;filter.frequency.value=frequency;filter.Q.value=.7;gain.gain.value=volume;
  src.connect(filter);filter.connect(gain);gain.connect(this.effectsGain);src.start(time);src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect()};
 }
 play(kind){
  const ctx=this.context;if(!ctx||ctx.state!=='running'||!this.settings.sound||this.settings.effectsVolume<=0||document.hidden)return false;
  const now=ctx.currentTime,delay=kind==='step' ? .28 : kind==='celebrate' ? 5 : .1;
  if(now-(this.last.get(kind)??-Infinity)<delay)return false;
  this.last.set(kind,now);
  if(kind==='step'){
   // A short low-mid footfall stays audible under the bell/pluck music.
   // The brighter grass rustle alone was too quiet on laptop speakers.
   this.tone(300+Math.random()*30,now,.15,.42,'sine',170);
   this.noise(now+.012,.13,.34,2200);
   this.tone(760+Math.random()*60,now+.018,.09,.08,'sine',480);
  }
  else if(kind==='page'){this.noise(now,.17,.23,2400);this.noise(now+.055,.13,.13,4200)}
  else if(kind==='correct'){this.tone(660,now,.23,.16);this.tone(880,now+.15,.42,.15);this.tone(1320,now+.15,.3,.035)}
  else if(kind==='wrong'){this.tone(330,now,.18,.13,'triangle',270);this.tone(250,now+.13,.27,.1,'sine',185)}
  else if(kind==='celebrate'){
   [523.25,659.25,783.99,1046.5].forEach((f,i)=>this.tone(f,now+i*.14,.7,.12));
   for(const offset of [.35,.95,1.55]){this.noise(now+offset,.6,.23,1100,'lowpass');this.tone(160,now+offset,.4,.1,'sine',65);[0,.045,.09,.15].forEach((d,i)=>this.tone(1600+i*360,now+offset+d,.28,.025))}
  }else return false;
  return true;
 }
}
