
'use strict';
// Local-only game. The PNG motifs are listed in ASSETS (index.html), texts and languages in sprachen.js.
// No dependencies, analytics or remote storage; sw.js only caches the game's own files for offline play.
const $ = id => document.getElementById(id);
const LEVELS = [2,3,4,5];
const STORAGE_KEY = 'sternenpuzzle.v1';
const BOARD_SIZE = 1200;
const svgIcon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const runtime = {page:'gallery', game:null, selected:null, drag:null, loading:false, generation:0,
  sessionStarted:null, help:true, sound:false, audio:null, hintTimer:null, saveTimer:null,
  paused:false, ghost:null, hoveredSlot:null, suppressClicksUntil:0, updateReady:false, heroStarted:false};
let storageAvailable = true;
let saved = {version:1, level:3, theme:THEMES[0].id, stars:[], sound:false, labels:'zahlen', pieceLabels:false, lang:null, resume:null};
function seededRandom(seed) {
  let value=seed>>>0;
  return function(){value=(value+0x6D2B79F5)>>>0;let t=Math.imul(value^(value>>>15),1|value);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};
}
function shuffled(items,rng=Math.random){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function newSeed(){try{return crypto.getRandomValues(new Uint32Array(1))[0];}catch{return Math.floor(Math.random()*4294967296);}}
function formatTime(milliseconds){const seconds=Math.floor(Math.max(0,milliseconds)/1000);return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
function generatePieces(n,seed){
  const random=seededRandom(seed), h=Array.from({length:n-1},()=>Array.from({length:n},()=>random()>.5?1:-1)),
    v=Array.from({length:n},()=>Array.from({length:n-1},()=>random()>.5?1:-1));
  return Array.from({length:n*n},(_,id)=>{const row=Math.floor(id/n),col=id%n;return {id,row,col,
    edges:[row===0?0:-h[row-1][col],col===n-1?0:v[row][col],row===n-1?0:h[row][col],col===0?0:-v[row][col-1]],placed:false};});
}
// A clockwise edge's positive offset points outwards. Adjacent signs are opposite.
function puzzlePath(piece,cell,pad,PathClass=Path2D){
  const p=new PathClass();p.moveTo(pad,pad);
  function edge(x,y,dx,dy,sign){
    const point=(t,z)=>[x+dx*t+dy*z*sign,y+dy*t-dx*z*sign];
    const line=(t,z=0)=>p.lineTo(...point(t,z));
    const curve=(a,b,c,d,e,f)=>p.bezierCurveTo(...point(a,b),...point(c,d),...point(e,f));
    if(sign===0){line(1);return;}
    line(.33);curve(.41,0,.445,-.025,.44,.035);curve(.435,.066,.36,.086,.37,.14);
    curve(.38,.223,.62,.223,.63,.14);curve(.64,.086,.565,.066,.56,.035);
    curve(.555,-.025,.59,0,.67,0);line(1);
  }
  edge(pad,pad,cell,0,piece.edges[0]);edge(pad+cell,pad,0,cell,piece.edges[1]);
  edge(pad+cell,pad+cell,-cell,0,piece.edges[2]);edge(pad,pad+cell,0,-cell,piece.edges[3]);p.closePath();return p;
}
function sanitizeSave(data){
  const clean={version:1,level:3,theme:THEMES[0].id,stars:[],sound:false,labels:'zahlen',pieceLabels:false,lang:null,resume:null};
  if(!data || data.version!==1)return clean;
  if(LEVELS.includes(data.level))clean.level=data.level;
  if(THEMES.some(t=>t.id===data.theme))clean.theme=data.theme;
  clean.sound=data.sound===true;
  if(LABEL_MODES.includes(data.labels))clean.labels=data.labels;
  clean.pieceLabels=data.pieceLabels===true;
  if(LANGUAGES.some(l=>l.id===data.lang))clean.lang=data.lang;
  if(Array.isArray(data.stars))clean.stars=[...new Set(data.stars.filter(x=>typeof x==='string'&&ASSETS.some(a=>LEVELS.some(n=>x===`${a.id}:${n}`))))];
  const r=data.resume;
  if(r && Number.isInteger(r.motif) && r.motif>=0 && r.motif<ASSETS.length && LEVELS.includes(r.n) && Number.isInteger(r.seed)){
    const placed=Array.isArray(r.placed)?[...new Set(r.placed.filter(x=>Number.isInteger(x)&&x>=0&&x<r.n*r.n))]:[];
    const raw=Array.isArray(r.order)?[...new Set(r.order.filter(x=>Number.isInteger(x)&&x>=0&&x<r.n*r.n&&!placed.includes(x)))]:[];
    const missing=Array.from({length:r.n*r.n},(_,i)=>i).filter(x=>!placed.includes(x)&&!raw.includes(x));
    if(placed.length<r.n*r.n)clean.resume={motif:r.motif,n:r.n,seed:r.seed>>>0,placed,order:raw.concat(missing),
      elapsed:Number.isFinite(r.elapsed)?Math.min(Math.max(0,r.elapsed),31536000000):0,
      moves:Number.isFinite(r.moves)?Math.min(Math.max(0,Math.floor(r.moves)),1000000):0,
      hints:Number.isFinite(r.hints)?Math.min(Math.max(0,Math.floor(r.hints)),1000000):0};
  }
  return clean;
}
function readSaved(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)saved=sanitizeSave(JSON.parse(raw));}catch{storageAvailable=false;}}
function writeSaved(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));}catch{storageAvailable=false;$('storageNote').textContent=t('storageSession');}}
function elapsedNow(){const g=runtime.game;if(!g)return 0;return g.elapsed+(runtime.sessionStarted!==null?performance.now()-runtime.sessionStarted:0);}
function pauseClock(){if(runtime.sessionStarted!==null&&runtime.game){runtime.game.elapsed+=performance.now()-runtime.sessionStarted;runtime.sessionStarted=null;}}
function resumeClock(){if(runtime.page==='game'&&runtime.game&&!runtime.game.complete&&!runtime.loading&&!document.hidden&&!runtime.paused&&runtime.sessionStarted===null)runtime.sessionStarted=performance.now();}
function persistGame(){
  if(runtime.game&&!runtime.game.complete){const g=runtime.game;saved.resume={motif:g.motif,n:g.n,seed:g.seed,placed:g.pieces.filter(p=>p.placed).map(p=>p.id),order:g.order.filter(id=>!g.pieces[id].placed),elapsed:elapsedNow(),moves:g.moves,hints:g.hints};}
  writeSaved();
}
function setStatus(text){$('statusText').textContent=text;}
function playSound(kind){
  if(!runtime.sound)return;
  try{
    if(!runtime.audio)runtime.audio=new (window.AudioContext||window.webkitAudioContext)();
    const ctx=runtime.audio;if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    const notes=kind==='win'?[523.25,659.25,783.99,1046.5]:kind==='correct'?[659.25,880]:kind==='hint'?[523.25,587.33]:[330];
    notes.forEach((freq,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.105;
      osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.055,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+.19);osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+.21);});
  }catch{runtime.sound=false;saved.sound=false;updateSound();writeSaved();}
}
function updateSound(){const on=runtime.sound;$('soundBtn').setAttribute('aria-pressed',String(on));$('soundBtn').setAttribute('aria-label',on?t('soundTurnOff'):t('soundTurnOn'));$('soundUse').setAttribute('href',on?'#i-sound':'#i-mute');$('soundLabel').textContent=on?t('soundOn'):t('soundOff');}
// Learning labels on the board: numbers, capital letters, dice dots (up to 9 pieces) or none.
const LABEL_MODES=['zahlen','buchstaben','wuerfel','aus'];
// Dot positions in a 3×3 grid, like on a die; 7 to 9 continue the pattern.
const DICE_DOTS=[[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8],[0,2,3,4,5,6,8],[0,1,2,3,5,6,7,8],[0,1,2,3,4,5,6,7,8]];
const diceSvg=count=>`<svg class="dice" viewBox="0 0 24 24" aria-hidden="true">${DICE_DOTS[count-1].map(i=>`<circle cx="${5+i%3*7}" cy="${5+Math.floor(i/3)*7}" r="2.3"/>`).join('')}</svg>`;
const labelMode=n=>saved.labels==='wuerfel'&&n*n>DICE_DOTS.length?'zahlen':saved.labels;
// text: short name for screen readers, show: written in the status line, say: read aloud, voice: its recording (stimme/).
function slotLabel(id,mode){
  const number=String(id+1);
  // Each language has its own alphabet and words (sprachen.js); a puzzle has at most 25 places.
  if(mode==='buchstaben'){const l=lettersOf(currentLanguage)[id];return {text:l.letter,show:t('letterShow',l),say:t('letterSay',l),voice:`buchstabe-${l.letter.toLowerCase()}`,html:l.letter};}
  if(mode==='wuerfel')return {text:number,show:t('dots',{n:id+1}),say:number,voice:`zahl-${number.padStart(2,'0')}`,html:diceSvg(id+1)};
  return {text:number,show:number,say:number,voice:`zahl-${number.padStart(2,'0')}`,html:mode==='aus'?'':number};
}
function labelElement(id,mode,className){const el=document.createElement('span');el.className=className+(mode==='wuerfel'?' is-dice':'');el.innerHTML=slotLabel(id,mode).html;el.setAttribute('aria-hidden','true');return el;}
// Read-aloud follows the sound button. German and English play recordings (playRecording); other languages,
// and any text without a recording, use the device's own voice for the chosen language (works offline).
// In the store apps (Capacitor) the native text-to-speech plugin speaks, because WebViews often lack speechSynthesis.
// Prefer high-quality voices; iOS also lists robotic Eloquence and novelty voices that sound bad for children.
// Without a voice for the language, a close one is used (Serbian: Croatian, then Bosnian; they read Latin script).
const POOR_VOICES=/\b(eddy|flo|grandma|grandpa|oma|opa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|compact)\b/i;
const GOOD_VOICES=/premium|enhanced|erweitert|neural|natural|siri|google|online/i;
const FAVOURITE_VOICES={de:/anna|petra|helena|katja|marlene|vicki/i,en:/serena|kate|daniel|martha|arthur|samantha/i};
function voiceScore(v,code){
  const lang=String(v.lang||'').replace('_','-');if(lang.split('-')[0].toLowerCase()!==code)return -1;
  const name=String(v.name||'')+' '+String(v.voiceURI||'');
  return (POOR_VOICES.test(name)?0:4)+(GOOD_VOICES.test(name)?2:0)+(lang.toLowerCase()===VOICE_TAGS[code].toLowerCase()?1:0)+(FAVOURITE_VOICES[code]?.test(name)?1:0);
}
// The best voice for the current language: {index, code}, or null when the device has none.
function bestVoice(voices){
  for(const code of currentLanguage.voices){let index=-1,score=-1;voices.forEach((v,i)=>{const s=voiceScore(v,code);if(s>score){index=i;score=s;}});if(index>=0)return {index,code};}
  return null;
}
const nativeTts=(()=>{const cap=window.Capacitor;if(!cap||!cap.isNativePlatform||!cap.isNativePlatform())return null;
  try{return cap.Plugins&&cap.Plugins.TextToSpeech||(cap.registerPlugin?cap.registerPlugin('TextToSpeech'):null);}catch{return null;}})();
let nativeVoices=[],nativeVoice=null;
if(nativeTts)nativeTts.getSupportedVoices().then(r=>{nativeVoices=r&&r.voices||[];nativeVoice=bestVoice(nativeVoices);}).catch(()=>{});
let webVoice=null;
function pickWebVoice(){try{const voices=window.speechSynthesis.getVoices(),best=bestVoice(voices);webVoice=best?{voice:voices[best.index],code:best.code}:null;}catch{}}
if(!nativeTts&&'speechSynthesis' in window){pickWebVoice();try{window.speechSynthesis.addEventListener('voiceschanged',pickWebVoice);}catch{}}
function pickVoices(){if(nativeTts)nativeVoice=bestVoice(nativeVoices);else if('speechSynthesis' in window)pickWebVoice();}
// A Serbian voice gets Cyrillic, Croatian and Bosnian voices get Latin script.
const speechText=(text,code)=>code==='sr'?toCyrillic(text):code==='hr'||code==='bs'?toLatin(text):text;
// German and English have recorded voices (stimme/<language>/, VoxCPM2, Apache 2.0); other languages use the device voice.
// They play through Web Audio like the sounds, so on the iPhone they follow the mute switch too.
const VOICE_RECORDINGS=['de','en'];
const recordings=new Map();let recordingSource=null,recordingElement=null,webAudioFailed=false;
// XMLHttpRequest instead of fetch: the iOS app serves its files from capacitor://, where fetch can fail.
const loadRecording=url=>new Promise((ok,fail)=>{const xhr=new XMLHttpRequest();xhr.open('GET',url);xhr.responseType='arraybuffer';
  xhr.onload=()=>xhr.status===0||xhr.status===200?ok(xhr.response):fail(new Error(xhr.status));xhr.onerror=()=>fail(new Error('xhr'));xhr.send();});
function playRecording(voice,text){
  const url=`stimme/${currentLanguage.id}/${voice}.mp3`;
  if(webAudioFailed){playRecordingElement(url,text);return;}
  try{
    if(!runtime.audio)runtime.audio=new (window.AudioContext||window.webkitAudioContext)();
    const ctx=runtime.audio;if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    if(!recordings.has(url))recordings.set(url,loadRecording(url).then(data=>new Promise((ok,fail)=>ctx.decodeAudioData(data,ok,fail))));
    recordings.get(url).then(buffer=>{
      if(!runtime.sound)return;
      try{recordingSource?.stop();}catch{}
      const source=ctx.createBufferSource();source.buffer=buffer;source.connect(ctx.destination);source.start();recordingSource=source;
    }).catch(()=>{recordings.delete(url);webAudioFailed=true;playRecordingElement(url,text);});
  }catch{webAudioFailed=true;playRecordingElement(url,text);}
}
// Second way when Web Audio cannot load or decode a recording: a plain audio element, the device voice only as a last resort.
function playRecordingElement(url,text){
  try{
    recordingElement?.pause();
    const audio=new Audio(url);recordingElement=audio;let fellBack=false;
    const fallBack=()=>{if(fellBack||recordingElement!==audio)return;fellBack=true;speakWithDevice(text);};
    audio.addEventListener('error',fallBack);
    audio.play()?.catch(fallBack);
  }catch{speakWithDevice(text);}
}
function speak(text,voice){
  if(!runtime.sound||!text)return;
  if(voice&&VOICE_RECORDINGS.includes(currentLanguage.id)){playRecording(voice,text);return;}
  speakWithDevice(text);
}
function speakWithDevice(text){
  if(nativeTts){
    const code=nativeVoice?nativeVoice.code:currentLanguage.voices[0];
    // category 'ambient' keeps following the iPhone mute switch, like the web app.
    const options={text:speechText(text,code),lang:VOICE_TAGS[code],rate:.9,pitch:1.05,volume:1,category:'ambient'};if(nativeVoice)options.voice=nativeVoice.index;
    nativeTts.stop().catch(()=>{}).then(()=>nativeTts.speak(options)).catch(()=>{});return;
  }
  if(!('speechSynthesis' in window))return;
  try{if(!webVoice)pickWebVoice();const code=webVoice?webVoice.code:currentLanguage.voices[0];
    const synth=window.speechSynthesis,utterance=new SpeechSynthesisUtterance(speechText(text,code));utterance.lang=VOICE_TAGS[code];utterance.rate=.9;utterance.pitch=1.05;
    if(webVoice)utterance.voice=webVoice.voice;synth.cancel();synth.speak(utterance);}catch{}
}
function updateLabelOptions(){
  document.querySelectorAll('.mode').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===saved.labels)));
  const toggle=$('pieceLabelsBtn'),on=saved.pieceLabels&&saved.labels!=='aus';toggle.disabled=saved.labels==='aus';toggle.setAttribute('aria-pressed',String(on));
  $('pieceLabelsText').textContent=on?t('pieceLabelsOn'):t('pieceLabelsOff');
  $('modeNote').hidden=!(saved.labels==='wuerfel'&&saved.level*saved.level>DICE_DOTS.length);
}
function updateStars(){ $('starsCount').textContent=`${saved.stars.length} / ${ASSETS.length*LEVELS.length}`; }
const activeThemes=()=>THEMES.filter(t=>ASSETS.some(a=>a.theme===t.id));
const themeOf=id=>activeThemes().find(t=>t.id===id)||activeThemes()[0];
// Indexes into ASSETS (the saved resume and startGame use global indexes) for one theme.
const themeMotifs=themeId=>ASSETS.map((a,i)=>a.theme===themeId?i:-1).filter(i=>i>=0);
function themeStars(themeId){const ids=new Set(themeMotifs(themeId).map(i=>ASSETS[i].id));return saved.stars.filter(s=>ids.has(s.split(':')[0])).length;}
// Store apps: one world is free, a one-time purchase unlocks the others. The web demo only ships the free world;
// a browser with all files (local testing) plays everything. The store remembers the purchase, the device caches it.
const FREE_THEMES=['weltraum'];
const UNLOCK_PRODUCT='sternenpuzzle.alle_welten';
const UNLOCK_KEY='sternenpuzzle.unlocked';
const STORE_LINKS={play:'',apple:''};
const store={unlocked:false,price:'',busy:false,gate:null};
const themeLocked=id=>isNativeApp()&&!store.unlocked&&!FREE_THEMES.includes(id);
function renderThemes(){
  $('themes').replaceChildren();$('themes').hidden=activeThemes().length<2;
  activeThemes().forEach(theme=>{
    const hero=ASSETS.find(a=>a.id===theme.hero)||ASSETS[themeMotifs(theme.id)[0]],total=themeMotifs(theme.id).length*LEVELS.length,stars=themeStars(theme.id);
    const button=document.createElement('button');button.type='button';button.className='theme';button.setAttribute('aria-pressed',String(theme.id===saved.theme));
    const locked=themeLocked(theme.id);if(locked)button.classList.add('locked');
    button.setAttribute('aria-label',locked?t('worldLockedAria',{title:themeText(theme,'title')}):t('worldAria',{title:themeText(theme,'title'),stars,total}));
    const foot=locked?`${svgIcon('lock')}${t('worldLocked')}`:`${svgIcon('star')}${stars} / ${total}`;
    button.innerHTML=`<img src="${hero.src}" alt="" width="64" height="64"><span><span class="theme-name">${svgIcon(theme.icon)}${themeText(theme,'title')}</span><span class="theme-stars">${foot}</span></span>`;
    button.addEventListener('click',()=>{if(locked){openUnlock();return;}if(saved.theme===theme.id)return;saved.theme=theme.id;writeSaved();renderGallery();});
    $('themes').append(button);
  });
}
function updateHero(){
  const theme=themeOf(saved.theme);
  $('heroEyebrow').textContent=themeText(theme,'eyebrow');$('heroHighlight').textContent=themeText(theme,'highlight');$('heroText').textContent=themeText(theme,'text');
}
// Treasure route: every world has one route per piece count. Each finished picture lights up its station,
// all stations together open the chest. Nothing is locked; any station can be played at any time.
const routeDone=(themeId,n)=>themeMotifs(themeId).filter(i=>saved.stars.includes(`${ASSETS[i].id}:${n}`));
const routeComplete=(themeId,n)=>routeDone(themeId,n).length===themeMotifs(themeId).length;
function chestSvg(open){
  const line='stroke="#29284F" stroke-width="3" stroke-linejoin="round"';
  const lid=open?`<circle cx="32" cy="28" r="24" fill="#FFE9A8" opacity=".75"/><path d="M12 30 17 8h30l5 22Z" fill="#C27A48" ${line}/><path d="M16 26 20 12h24l4 14Z" fill="#9C5F3A"/>`
    :`<path d="M9 33c0-11 9-17 23-17s23 6 23 17Z" fill="#C27A48" ${line}/><path d="M9 29h46" stroke="#FFD36E" stroke-width="4"/>`;
  const treasure=open?`<path d="M12 33c3-7 10-9 20-9s17 2 20 9Z" fill="#FFD36E" ${line}/><circle cx="22" cy="27" r="3.5" fill="#F6A1BD" stroke="#29284F" stroke-width="2"/><circle cx="40" cy="26" r="3.5" fill="#A8DBE9" stroke="#29284F" stroke-width="2"/><path d="M31 18l2 4 4 .6-3 2.8.8 4.2-3.8-2-3.8 2 .8-4.2-3-2.8 4-.6Z" fill="#FFF3B0" stroke="#29284F" stroke-width="1.8"/>`:'';
  const lock=open?'':`<rect x="27" y="36" width="10" height="11" rx="2.5" fill="#FFD36E" ${line}/><circle cx="32" cy="41" r="1.6" fill="#29284F"/>`;
  return `<svg class="chest" viewBox="0 0 64 64" aria-hidden="true">${lid}${treasure}<rect x="9" y="32" width="46" height="24" rx="5" fill="#D9925C" ${line}/><path d="M9 41h46" stroke="#FFD36E" stroke-width="5"/>${lock}</svg>`;
}
// Treasure map: the stations wind across a little island in rows, the path ends at a red X with the chest.
// Phones get three stations per row, wider screens two rows, so the whole map fits on one screen.
const MAP_LINE='stroke="#29284F" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';
const MAP_DOODLES={
  compass:`<circle cx="50" cy="50" r="34" fill="#FFF6DD" ${MAP_LINE}/><path d="M50 14 57 50 50 86 43 50Z" fill="#A8DBE9" ${MAP_LINE}/><path d="M14 50 50 43 86 50 50 57Z" fill="#F6E3B4" ${MAP_LINE}/><path d="M50 14 57 50H43Z" fill="#E4574F" ${MAP_LINE}/><circle cx="50" cy="50" r="5" fill="#FFD36E" ${MAP_LINE}/>`,
  palm:`<path d="M50 90c3-18 2-34-5-50" fill="none" stroke="#9C5F3A" stroke-width="8" stroke-linecap="round"/><path d="M45 40C36 26 18 26 10 36c12-3 24-1 35 4Zm0 0c2-15 16-24 30-22-12 4-22 11-30 22Zm0 0c12-8 30-6 40 4-14-2-27-3-40-4Zm0 0c-13 1-24 11-26 24 8-10 17-17 26-24Z" fill="#6FCF97" ${MAP_LINE}/><circle cx="47" cy="44" r="4.5" fill="#9C5F3A"/>`,
  mountain:`<path d="M6 84 34 30l14 20 12-18 34 52Z" fill="#B9A8E0" ${MAP_LINE}/><path d="M34 30 26 46l8-4 6 5Zm26 2-6 9 7-2 4 4Z" fill="#fff"/>`,
  volcano:`<path d="M10 86 34 44h32l24 42Z" fill="#B48ACB" ${MAP_LINE}/><path d="M34 44c5 8 11 9 16 3 5 6 11 5 16-3Z" fill="#F7876F" ${MAP_LINE}/><path d="M50 34c-4-7-14-3-10 4l10 8 10-8c4-7-6-11-10-4Z" fill="#F6A1BD" ${MAP_LINE}/><path d="M64 22c-2-4-8-2-6 2l6 5 6-5c2-4-4-6-6-2Z" fill="#F6A1BD" ${MAP_LINE}/>`,
  egg:`<path d="M18 74c10 12 54 12 64 0" fill="#C99A6B" ${MAP_LINE}/><ellipse cx="50" cy="50" rx="21" ry="27" fill="#FFF3DA" ${MAP_LINE}/><circle cx="43" cy="42" r="4" fill="#9ADBC5"/><circle cx="57" cy="56" r="5" fill="#9ADBC5"/><circle cx="44" cy="62" r="3" fill="#F6A1BD"/>`,
  fern:`<path d="M14 84c2-26 18-40 36-40s34 14 36 40Z" fill="#6FCF97" ${MAP_LINE}/><path d="M32 84c2-14 8-22 18-26m0 0c10 4 16 12 18 26M50 58v26" fill="none" stroke="#3E9C6B" stroke-width="3"/><circle cx="30" cy="66" r="5" fill="#F6A1BD" ${MAP_LINE}/><circle cx="70" cy="62" r="5" fill="#FFD36E" ${MAP_LINE}/>`,
  footprints:`<g fill="#9C7BB8"><ellipse cx="34" cy="70" rx="9" ry="7"/><path d="M26 62l-6-10 9 6Zm8-4v-12l4 12Zm8 4 7-10-3 12Z"/><ellipse cx="64" cy="40" rx="9" ry="7"/><path d="M56 32l-6-10 9 6Zm8-4V16l4 12Zm8 4 7-10-3 12Z"/></g>`,
  house:`<path d="M24 52 50 30l26 22v34H24Z" fill="#FFE1B8" ${MAP_LINE}/><path d="M16 54 50 24l34 30" fill="none" stroke="#E4574F" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><rect x="42" y="64" width="16" height="22" rx="3" fill="#A8DBE9" ${MAP_LINE}/><circle cx="50" cy="48" r="5" fill="#FFD36E" ${MAP_LINE}/>`,
  lighthouse:`<path d="M38 88 43 36h14l5 52Z" fill="#fff" ${MAP_LINE}/><path d="M41 56h18M40 72h20" stroke="#E4574F" stroke-width="7"/><path d="M40 36h20l-3-12H43Z" fill="#FFD36E" ${MAP_LINE}/><path d="M42 24 50 14l8 10" fill="#E4574F" ${MAP_LINE}/><path d="M64 28l14-6M64 34h16M36 28l-14-6M36 34H20" stroke="#FFD36E" stroke-width="4" stroke-linecap="round"/>`,
  tree:`<rect x="45" y="56" width="10" height="30" rx="3" fill="#9C5F3A" ${MAP_LINE}/><circle cx="50" cy="42" r="24" fill="#6FCF97" ${MAP_LINE}/><circle cx="40" cy="38" r="4" fill="#E4574F"/><circle cx="58" cy="48" r="4" fill="#E4574F"/><circle cx="56" cy="30" r="4" fill="#E4574F"/>`,
  bone:`<g transform="rotate(-25 50 50)"><path d="M30 42a9 9 0 1 1 8-12h24a9 9 0 1 1 8 12 9 9 0 1 1-8 12H38a9 9 0 1 1-8-12Z" fill="#fff" ${MAP_LINE}/></g>`,
  fir:`<path d="M50 12 74 48H62l18 30H20l18-30H26Z" fill="#7CC8A8" ${MAP_LINE}/><path d="M50 12 59 26H41Zm-14 36h28l-4 6H40Zm-8 30h44" fill="#fff"/><rect x="44" y="78" width="12" height="10" fill="#9C5F3A" ${MAP_LINE}/>`,
  igloo:`<path d="M14 82a36 36 0 0 1 72 0Z" fill="#fff" ${MAP_LINE}/><path d="M22 66h56M32 52h36M50 46v20M36 66v16M64 66v16" stroke="#BFD6EE" stroke-width="3"/><path d="M38 82a12 12 0 0 1 24 0Z" fill="#7C9CCB" ${MAP_LINE}/>`,
  snowflake:`<g stroke="#7C9CCB" stroke-width="6" stroke-linecap="round"><path d="M50 16v68M21 33l58 34M21 67l58-34"/><path d="M42 22l8 8 8-8M42 78l8-8 8 8" fill="none"/></g><circle cx="50" cy="50" r="7" fill="#fff" ${MAP_LINE}/>`,
  icepeak:`<path d="M8 84 36 26l16 24 10-14 30 48Z" fill="#CFE6F7" ${MAP_LINE}/><path d="M36 26 28 44l8-4 6 6Zm26 10-5 9 6-2 4 4Z" fill="#fff"/><path d="M30 70l6-8 6 8Z" fill="#A8DBE9"/>`,
  ship:`<path d="M14 62h72l-10 20H24Z" fill="#C27A48" ${MAP_LINE}/><path d="M48 16v46" ${MAP_LINE}/><path d="M50 20c16 6 22 18 22 34H50Z" fill="#FFF6DD" ${MAP_LINE}/><path d="M48 18 32 24l16 6Z" fill="#E4574F" ${MAP_LINE}/>`,
  octopus:`<path d="M30 52a20 20 0 0 1 40 0c0 6 2 12 8 18-8 2-12-4-14-8 0 6-2 12-6 16-4-4-6-10-6-14 0 4-2 10-6 14-4-4-6-10-6-16-2 4-6 10-14 8 6-6 4-12 4-18Z" fill="#F6A1BD" ${MAP_LINE}/><circle cx="43" cy="50" r="3" fill="#29284F"/><circle cx="57" cy="50" r="3" fill="#29284F"/>`,
  rock:`<path d="M12 80c2-20 14-34 30-36 6-12 26-12 32 4 10 6 16 18 14 32Z" fill="#C9B79C" ${MAP_LINE}/><path d="M36 64c4-4 10-4 14 0M58 56c4-3 8-3 12 0" fill="none" stroke="#29284F" stroke-width="3" stroke-linecap="round"/>`,
  towers:`<rect x="16" y="40" width="22" height="46" fill="#B9A8E0" ${MAP_LINE}/><rect x="40" y="22" width="22" height="64" fill="#A8DBE9" ${MAP_LINE}/><rect x="64" y="50" width="20" height="36" fill="#F6A1BD" ${MAP_LINE}/><path d="M22 50h10M22 62h10M46 32h10M46 44h10M46 56h10M70 60h8" stroke="#FFF3B0" stroke-width="5"/>`,
  bolt:`<path d="M58 8 24 54h22l-8 38 38-50H54Z" fill="#FFD36E" ${MAP_LINE}/>`,
  balloon:`<path d="M50 12c18 0 28 12 28 26 0 16-16 26-24 34h-8C38 64 22 54 22 38c0-14 10-26 28-26Z" fill="#F6A1BD" ${MAP_LINE}/><path d="M50 12c-8 6-10 18-10 28 0 12 4 22 6 32m4-60c8 6 10 18 10 28 0 12-4 22-6 32" fill="none" stroke="#29284F" stroke-width="2.5"/><rect x="42" y="78" width="16" height="12" rx="2" fill="#C27A48" ${MAP_LINE}/>`,
  star:`<path d="M50 12l11 23 25 3-18 17 5 25-23-12-23 12 5-25-18-17 25-3Z" fill="#FFD36E" ${MAP_LINE}/>`,
  planet:`<circle cx="50" cy="50" r="22" fill="#F6A1BD" ${MAP_LINE}/><ellipse cx="50" cy="52" rx="40" ry="11" fill="none" stroke="#29284F" stroke-width="9" transform="rotate(-18 50 52)"/><ellipse cx="50" cy="52" rx="40" ry="11" fill="none" stroke="#FFD36E" stroke-width="4" transform="rotate(-18 50 52)"/><path d="M28 48a22 22 0 0 0 44 0" fill="#F6A1BD" ${MAP_LINE} transform="rotate(-18 50 52)"/>`,
  rocket:`<g transform="rotate(30 50 50)"><path d="M50 8c14 12 18 34 12 58H38C32 42 36 20 50 8Z" fill="#fff" ${MAP_LINE}/><path d="M50 8c6 5 10 11 12 18H38c2-7 6-13 12-18Z" fill="#E4574F" ${MAP_LINE}/><circle cx="50" cy="40" r="7" fill="#A8DBE9" ${MAP_LINE}/><path d="M38 52 26 70h14Zm24 0 12 18H60Z" fill="#B9A8E0" ${MAP_LINE}/><path d="M42 68c2 10 6 16 8 20 2-4 6-10 8-20Z" fill="#FFD36E" ${MAP_LINE}/></g>`,
  crater:`<ellipse cx="50" cy="56" rx="34" ry="20" fill="#D9CBF5" ${MAP_LINE}/><ellipse cx="50" cy="52" rx="22" ry="11" fill="#C3B1EE"/><circle cx="24" cy="30" r="6" fill="#D9CBF5" ${MAP_LINE}/>`,
  alien:`<path d="M30 86c0-22 8-34 20-34s20 12 20 34Z" fill="#9BE08F" ${MAP_LINE}/><circle cx="50" cy="40" r="18" fill="#9BE08F" ${MAP_LINE}/><circle cx="50" cy="38" r="7" fill="#fff" ${MAP_LINE}/><circle cx="50" cy="38" r="3" fill="#29284F"/><path d="M50 22V10" ${MAP_LINE}/><circle cx="50" cy="9" r="4" fill="#FFD36E" ${MAP_LINE}/><path d="M68 62l12-10" ${MAP_LINE}/>`,
  whale:`<path d="M12 64c0-16 18-26 40-26 20 0 32 12 32 24 6-4 10-12 8-20 6 6 8 18 0 26H22c-6 0-10-2-10-4Z" fill="#7FB8E6" ${MAP_LINE}/><circle cx="34" cy="54" r="3" fill="#29284F"/><path d="M40 30c0-8 4-12 8-14m-8 14c-2-8-6-12-10-12" fill="none" stroke="#7FB8E6" stroke-width="4" stroke-linecap="round"/>`,
  ufo:`<ellipse cx="50" cy="56" rx="38" ry="12" fill="#B9A8E0" ${MAP_LINE}/><path d="M32 52a18 18 0 0 1 36 0Z" fill="#A8DBE9" ${MAP_LINE}/><circle cx="30" cy="58" r="3" fill="#FFD36E"/><circle cx="50" cy="61" r="3" fill="#FFD36E"/><circle cx="70" cy="58" r="3" fill="#FFD36E"/>`
};
const MAP_WORLDS={
  weltraum:{sea:'#3d3784',sparkle:'#fff3b0',land:'#efe6ff',edge:'#c9b8f0',sea2:'ufo',land2:['planet','rocket','crater','alien','star']},
  dinos:{sea:'#9fdcd6',sparkle:'#fff',land:'#d6f1bf',edge:'#9ccf86',sea2:'whale',land2:['volcano','palm','egg','fern','footprints']},
  hunde:{sea:'#a9d8f0',sparkle:'#fff',land:'#ddf2c9',edge:'#a7d38f',sea2:'lighthouse',land2:['house','tree','bone','house','tree']},
  eis:{sea:'#a9d4ef',sparkle:'#fff',land:'#f7fbff',edge:'#c8def0',sea2:'whale',land2:['fir','igloo','icepeak','snowflake','fir']},
  piraten:{sea:'#8fd6dd',sparkle:'#fff',land:'#f8e3b5',edge:'#e5c487',sea2:'ship',land2:['palm','rock','octopus','palm','mountain']},
  helden:{sea:'#c9c2f0',sparkle:'#fff3b0',land:'#ffe9d2',edge:'#f1c9a0',sea2:'balloon',land2:['towers','bolt','tree','star','towers']}
};
const mapNum=v=>Math.round(v*10)/10;
function mapDoodle(name,x,y,size){const k=size/100;return `<g transform="translate(${mapNum(x-size/2)} ${mapNum(y-size/2)}) scale(${mapNum(k*100)/100})">${MAP_DOODLES[name]}</g>`;}
// Closed smooth outline through the points (Catmull-Rom as cubic Béziers).
function mapSmooth(p){const n=p.length;return `M${p[0].map(mapNum)}`+p.map((b,i)=>{const a=p[(i-1+n)%n],c=p[(i+1)%n],d=p[(i+2)%n];return `C${mapNum(b[0]+(c[0]-a[0])/6)},${mapNum(b[1]+(c[1]-a[1])/6)} ${mapNum(c[0]-(d[0]-b[0])/6)},${mapNum(c[1]-(d[1]-b[1])/6)} ${c.map(mapNum)}`;}).join('')+'Z';}
function mapLayout(count,narrow){
  const points=count+1,cols=narrow?3:Math.max(3,Math.ceil(points/2)),rows=Math.ceil(points/cols);
  const W=1000,cw=W/(cols+.7),rh=cw*(narrow?.98:.84),mx=cw*.35,my=cw*.3,H=rows*rh+2*my;
  const spots=[...Array(points)].map((_,i)=>{const r=Math.floor(i/cols),c=r%2?cols-1-i%cols:i%cols;return {r,c,x:mx+cw*(c+.5)+(r%2?-1:1)*cw*.05,y:my+rh*(r+.5)+(c%2?1:-1)*rh*.07};});
  return {W,H,cw,rh,mx,my,cols,rows,spots,size:cw*(narrow?.64:.6)};
}
function mapSvg(theme,m,done,open){
  const look=MAP_WORLDS[theme]||MAP_WORLDS.piraten,{W,H,cw,rh,mx,my,cols,rows,spots}=m;
  let rnd=theme.length*7+spots.length;const rand=()=>{rnd=(rnd*9301+49297)%233280;return rnd/233280;};
  const outline=[...Array(40)].map((_,i)=>{const t=i/40*2*Math.PI,c=Math.cos(t),s=Math.sin(t),k=.97+rand()*.06;
    return [W/2+(W/2-cw*.12)*Math.sign(c)*Math.abs(c)**.35*k,H/2+(H/2-cw*.1)*Math.sign(s)*Math.abs(s)**.35*k];});
  const island=mapSmooth(outline);
  const sparkles=[...Array(46)].map(()=>{const x=rand()*W,y=rand()*H,edge=Math.min(x,W-x,y,H-y);if(edge>cw*.14)return '';
    return look.sea==='#3d3784'?`<circle cx="${mapNum(x)}" cy="${mapNum(y)}" r="${mapNum(3+rand()*4)}" fill="${look.sparkle}"/>`
      :`<path d="M${mapNum(x-12)} ${mapNum(y)}q6-7 12 0t12 0" fill="none" stroke="${look.sparkle}" stroke-width="4" stroke-linecap="round"/>`;}).join('');
  // Doodles sit where no path runs: between the columns and rows, and in the empty cells of the last row.
  const free=[];for(let r=0;r<rows-1;r++)for(let c=0;c<cols-1;c++)free.push([mx+cw*(c+1),my+rh*(r+1),Math.min(cw,rh)*.5]);
  const lastRow=rows-1,used=spots.filter(s=>s.r===lastRow).map(s=>s.c);
  for(let c=0;c<cols;c++)if(!used.includes(c))free.push([mx+cw*(c+.5),my+rh*(lastRow+.5),Math.min(cw,rh)*.72]);
  const doodles=free.map(([x,y,size],i)=>mapDoodle(look.land2[i%look.land2.length],x,y,size)).join('');
  const segs=spots.slice(1).map((b,i)=>{const a=spots[i];let d;
    if(a.r===b.r){const bow=(i%2?1:-1)*rh*.1;d=`M${mapNum(a.x)} ${mapNum(a.y)}C${mapNum(a.x+(b.x-a.x)/3)} ${mapNum(a.y+bow)} ${mapNum(b.x-(b.x-a.x)/3)} ${mapNum(b.y+bow)} ${mapNum(b.x)} ${mapNum(b.y)}`;}
    else{const side=a.x>W/2?1:-1,out=cw*.62;d=`M${mapNum(a.x)} ${mapNum(a.y)}C${mapNum(a.x+side*out)} ${mapNum(a.y)} ${mapNum(b.x+side*out)} ${mapNum(b.y)} ${mapNum(b.x)} ${mapNum(b.y)}`;}
    const walked=done[i]&&(i+1<done.length?done[i+1]:open);
    return `<path d="${d}" class="map-trail${walked?' walked':''}"/>`;}).join('');
  const goal=spots[spots.length-1],x=m.size*.3;
  const mark=`<path d="M${mapNum(goal.x-x)} ${mapNum(goal.y-x*.55)}l${mapNum(2*x)} ${mapNum(x*1.1)}m0 -${mapNum(x*1.1)}l-${mapNum(2*x)} ${mapNum(x*1.1)}" stroke="#E4574F" stroke-width="${mapNum(cw*.07)}" stroke-linecap="round" transform="translate(0 ${mapNum(m.size*.72)})"/>`;
  const corner=Math.min(cw*.42,my*1.6);
  return `<svg class="map-art" viewBox="0 0 ${W} ${mapNum(H)}" preserveAspectRatio="none" aria-hidden="true"><rect width="${W}" height="${mapNum(H)}" fill="${look.sea}"/>${sparkles}<path d="${island}" fill="${look.edge}" transform="translate(0 ${mapNum(cw*.04)})"/><path d="${island}" fill="${look.land}" stroke="${look.edge}" stroke-width="5"/>${doodles}${mapDoodle('compass',W-corner*.62,corner*.62,corner)}${mapDoodle(look.sea2,corner*.62,H-corner*.62,corner)}<g class="map-trails">${segs}</g>${mark}</svg>`;
}
function renderRoute(){
  const theme=themeOf(saved.theme),n=saved.level,motifs=themeMotifs(theme.id),done=new Set(routeDone(theme.id,n));
  const next=motifs.find(i=>!done.has(i)),open=next===undefined,left=motifs.length-done.size,chests=LEVELS.filter(l=>routeComplete(theme.id,l)).length;
  $('routeTitle').textContent=t('routeTitle',{n:n*n});
  $('routeText').textContent=open?t('routeOpen',{n:n*n}):t('routeLeft',{left});
  $('routeChests').innerHTML=`${svgIcon('chest')}${chests} / ${LEVELS.length}`;$('routeChests').title=t('routeChestsTitle',{chests,total:LEVELS.length});
  runtime.mapNarrow=$('route').clientWidth<560;
  const map=mapLayout(motifs.length,runtime.mapNarrow),place=(el,spot,scale=1)=>{el.style.left=`${spot.x/map.W*100}%`;el.style.top=`${spot.y/map.H*100}%`;el.style.width=`${map.size*scale/map.W*100}%`;};
  $('routeMap').style.aspectRatio=`${map.W} / ${mapNum(map.H)}`;
  $('routeArt').innerHTML=mapSvg(theme.id,map,motifs.map(i=>done.has(i)),open);
  $('routePath').replaceChildren();
  motifs.forEach((index,position)=>{
    const asset=ASSETS[index],isDone=done.has(index),item=document.createElement('li'),button=document.createElement('button');
    button.type='button';button.className=`station${isDone?' done':''}${index===next?' next':''}`;
    button.setAttribute('aria-label',t('stationAria',{position:position+1,title:motifText(asset,'title'),state:t(isDone?'stationDone':index===next?'stationNext':'stationOpen'),n:n*n}));
    button.innerHTML=`<img src="${asset.src}" alt="" width="64" height="64" loading="lazy"><span class="station-badge">${isDone?svgIcon('check'):position+1}</span>`;
    button.addEventListener('click',()=>startGame(index,n));item.append(button);place(item,map.spots[position]);$('routePath').append(item);
  });
  const goal=document.createElement('li');goal.className=`route-goal${open?' open':''}`;place(goal,map.spots[motifs.length],1.25);
  goal.innerHTML=`<span role="img" aria-label="${t(open?'chestOpen':'chestClosed')}">${chestSvg(open)}</span>`;$('routePath').append(goal);
}
function renderGallery(){
  saved.theme=themeOf(themeLocked(saved.theme)?FREE_THEMES[0]:saved.theme).id;
  $('gallery').replaceChildren();renderThemes();updateHero();renderRoute();$('heroCount').textContent=t('heroCount',{n:ASSETS.length});
  const icon=themeOf(saved.theme).icon;
  themeMotifs(saved.theme).forEach((index,position)=>{
    const asset=ASSETS[index],earned=saved.stars.filter(s=>s.startsWith(asset.id+':')).length;
    const button=document.createElement('button');button.type='button';button.className='motif';
    button.setAttribute('aria-label',t('motifAria',{title:motifText(asset,'title'),n:saved.level*saved.level,earned}));
    const starIcons=LEVELS.map(n=>`<svg class="icon ${saved.stars.includes(asset.id+':'+n)?'earned':''}" aria-hidden="true"><use href="#i-star"/></svg>`).join('');
    button.innerHTML=`<div class="motif-image"><img src="${asset.src}" alt="${motifText(asset,'alt')}" width="480" height="480" loading="lazy"><span class="motif-badge">${svgIcon(icon)}${t('motifBadge',{number:String(position+1).padStart(2,'0')})}</span></div><div class="motif-copy"><h3>${motifText(asset,'title')}</h3><p>${motifText(asset,'description')}</p><div class="motif-foot"><span class="motif-action">${t('motifAction')} ${svgIcon('arrow')}</span><span class="star-row" aria-label="${t('starsAria',{earned})}">${starIcons}</span></div></div>`;
    button.addEventListener('click',()=>startGame(index,saved.level));$('gallery').append(button);
  });
  document.querySelectorAll('.level').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.n)===saved.level)));
  updateLabelOptions();updateStars();updateResume();syncHeroVideo();
}
// The start-page video only plays while the gallery is visible. With reduced motion (or when autoplay is
// blocked, e.g. iOS low power mode) it waits for the play button instead of starting by itself.
function syncHeroVideo(){
  const video=$('heroVideo'),still=window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!runtime.heroStarted;
  if(runtime.page!=='gallery'||document.hidden||still){video.pause();$('heroPlay').hidden=runtime.page!=='gallery'||!still;return;}
  video.muted=true;const playing=video.play();
  if(playing)playing.then(()=>{$('heroPlay').hidden=true;}).catch(()=>{$('heroPlay').hidden=false;});
}
function updateResume(){const r=saved.resume;$('resumeBox').hidden=!r;if(r)$('resumeText').textContent=t('resumeText',{title:motifText(ASSETS[r.motif],'title'),placed:r.placed.length,total:r.n*r.n});}
const imageCache=new Map();
function loadImage(asset){
  if(imageCache.has(asset.id))return imageCache.get(asset.id);
  const promise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Das eingebettete Bild konnte nicht geladen werden.'));img.src=asset.src;});imageCache.set(asset.id,promise);return promise;
}
function buildPieceCanvas(piece,img,n){
  const cell=BOARD_SIZE/n,pad=cell*.235,size=Math.ceil(cell+pad*2),canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  const c=canvas.getContext('2d');if(!c)throw new Error('Canvas ist in diesem Browser nicht verfügbar.');
  const path=puzzlePath(piece,cell,pad);c.save();c.clip(path);c.drawImage(img,pad-piece.col*cell,pad-piece.row*cell,BOARD_SIZE,BOARD_SIZE);c.restore();
  c.strokeStyle='rgba(41,34,74,.7)';c.lineWidth=Math.max(1.8,cell*.007);c.stroke(path);piece.canvas=canvas;piece.pad=pad;piece.cell=cell;return canvas;
}
async function startGame(motif,n,restore=null){
  if(runtime.loading)return;
  if(themeLocked(ASSETS[motif].theme)){openUnlock();return;}
  if(runtime.game&&!runtime.game.complete){pauseClock();persistGame();}
  cleanupDrag();clearHint();runtime.selected=null;runtime.loading=true;runtime.paused=false;runtime.sessionStarted=null;
  const generation=++runtime.generation;
  const seed=restore?restore.seed:newSeed(),pieces=generatePieces(n,seed),placed=new Set(restore?restore.placed:[]);
  pieces.forEach(p=>p.placed=placed.has(p.id));
  runtime.game={motif,n,seed,pieces,order:restore?restore.order.slice():shuffled(pieces.map(p=>p.id),seededRandom(seed^0xA28C49E1)),
    elapsed:restore?restore.elapsed:0,moves:restore?restore.moves:0,hints:restore?restore.hints:0,complete:false};
  const asset=ASSETS[motif];if(saved.theme!==asset.theme){saved.theme=asset.theme;writeSaved();}runtime.page='game';document.body.classList.add('playing');syncHeroVideo();$('galleryPage').hidden=true;$('gamePage').hidden=false;
  $('gameTitle').textContent=motifText(asset,'title');$('gameSubtitle').textContent=t('gameSubtitle',{n:n*n});
  $('referenceImg').src=asset.src;$('previewImg').src=asset.src;$('previewImg').alt=motifText(asset,'alt');
  $('board').classList.remove('complete');$('helpBtn').disabled=false;runtime.help=true;updateHelp();
  $('slots').replaceChildren();$('slots').style.setProperty('--n',n);$('slots').classList.remove('has-selection');
  const mode=labelMode(n);
  pieces.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='slot';b.dataset.id=p.id;b.setAttribute('aria-label',t('slotAria',{label:slotLabel(p.id,mode).text,row:p.row+1,col:p.col+1}));if(mode!=='aus')b.append(labelElement(p.id,mode,'slot-label'));b.addEventListener('click',()=>tryPlace(runtime.selected,p.id));b.addEventListener('keydown',event=>{const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-n,ArrowDown:n}[event.key];if(step!==undefined){event.preventDefault();let next=p.id+step;while(next>=0&&next<pieces.length){const target=$('slots').children[next];if(!target.disabled){target.focus({preventScroll:true});break;}next+=step;}}});$('slots').append(b);});
  $('boardCanvas').getContext('2d').clearRect(0,0,BOARD_SIZE,BOARD_SIZE);$('tray').replaceChildren();$('tray').dataset.count=n*n;
  $('hintBtn').disabled=true;$('shuffleBtn').disabled=true;$('restartBtn').disabled=true;setStatus(t('preparing'));window.scrollTo(0,0);
  try{
    const img=await loadImage(asset);if(generation!==runtime.generation)return;
    pieces.forEach(p=>buildPieceCanvas(p,img,n));runtime.loading=false;
    renderBoard();renderTray();updateProgress();setStatus(t(placed.size?'welcomeBack':'startHint'));
    $('hintBtn').disabled=false;$('shuffleBtn').disabled=false;$('restartBtn').disabled=false;resumeClock();persistGame();
    $('gameTitle').setAttribute('tabindex','-1');$('gameTitle').focus({preventScroll:true});
  }catch(err){runtime.loading=false;setStatus(t('loadError'));$('restartBtn').disabled=false;}
}
function renderBoard(){
  const g=runtime.game,c=$('boardCanvas').getContext('2d');c.clearRect(0,0,BOARD_SIZE,BOARD_SIZE);
  g.pieces.forEach(p=>{const slot=$('slots').children[p.id];slot.classList.toggle('placed',p.placed);slot.disabled=p.placed;slot.setAttribute('aria-label',t('slotAria',{label:slotLabel(p.id,labelMode(g.n)).text,row:p.row+1,col:p.col+1})+(p.placed?t('slotPlaced'):''));if(p.placed)c.drawImage(p.canvas,p.col*p.cell-p.pad,p.row*p.cell-p.pad);});
}
function renderTray(){
  const g=runtime.game,mode=labelMode(g.n),marked=saved.pieceLabels&&mode!=='aus';$('tray').replaceChildren();g.order=g.order.filter(id=>!g.pieces[id].placed);
  g.order.forEach((id,index)=>{
    const piece=g.pieces[id],button=document.createElement('button');button.type='button';button.className='piece';button.dataset.piece=id;
    button.setAttribute('aria-label',t('pieceAria',{number:index+1}));button.setAttribute('aria-pressed',String(runtime.selected===id));button.classList.toggle('selected',runtime.selected===id);button.title=t('pieceTitle');button.append(piece.canvas);
    if(marked){button.append(labelElement(id,mode,'piece-label'));button.setAttribute('aria-label',t('pieceAriaLabel',{number:index+1,label:slotLabel(id,mode).text}));}
    button.addEventListener('click',event=>{if(performance.now()<runtime.suppressClicksUntil)return;selectPiece(runtime.selected===id?null:id);if(event.detail===0&&runtime.selected!==null){const first=[...$('slots').children].find(s=>!s.disabled);if(first)first.focus({preventScroll:true});}});
    button.addEventListener('pointerdown',event=>onPiecePointerDown(event,id,button));$('tray').append(button);
  });
  if(!g.order.length){const done=document.createElement('div');done.className='tray-empty';done.innerHTML=`${svgIcon('star')}<h3>${t('trayDoneTitle')}</h3><p>${t('trayDoneText')}</p>`;$('tray').append(done);}
  $('trayHeading').textContent=g.order.length?t('trayLeft',{n:g.order.length}):t('trayComplete');
}
function updateProgress(){
  const g=runtime.game,count=g.pieces.filter(p=>p.placed).length,total=g.n*g.n;
  $('progressBar').style.width=`${count/total*100}%`;$('progressLabel').textContent=t('progressLabel',{count,total});
  $('progressTrack').setAttribute('aria-valuemax',total);$('progressTrack').setAttribute('aria-valuenow',count);$('timeStat').textContent=formatTime(elapsedNow());$('movesStat').textContent=g.moves;
}
function selectPiece(id,quiet=false){
  if(runtime.loading||!runtime.game||runtime.game.complete)return;
  if(id!==null&&runtime.game.pieces[id].placed)return;
  runtime.selected=id;$('slots').classList.toggle('has-selection',id!==null);
  $('tray').querySelectorAll('.piece').forEach(b=>{const on=Number(b.dataset.piece)===id;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
  if(!quiet)setStatus(t(id===null?'chooseOther':'pieceSelected'));
}
function tryPlace(id,target){
  const g=runtime.game;if(runtime.loading||!g||g.complete)return;
  const mode=labelMode(g.n);
  if(id===null||id===undefined){
    // Tapping a free place without a piece names its sign, so the signs can be explored on their own.
    if(mode!=='aus'&&Number.isInteger(target)&&target>=0&&target<g.pieces.length){const l=slotLabel(target,mode);setStatus(t('slotInfo',{label:l.show}));speak(l.say,l.voice);}
    else setStatus(t('tapPieceFirst'));
    return;
  }
  if(!Number.isInteger(id)||id<0||id>=g.pieces.length||!Number.isInteger(target)||target<0||target>=g.pieces.length)return;
  if(g.pieces[id].placed||g.pieces[target].placed)return;
  g.moves++;
  if(id===target){
    clearHint();g.pieces[id].placed=true;runtime.selected=null;$('slots').classList.remove('has-selection');renderBoard();renderTray();updateProgress();playSound('correct');
    const count=g.pieces.filter(p=>p.placed).length;
    const phrases=t('praise'),phrase=phrases[count%phrases.length];
    if(mode==='aus')setStatus(phrase);else{const l=slotLabel(id,mode);setStatus(`${l.show}! ${phrase}`);speak(l.say,l.voice);}
    persistGame();
    if(count===g.pieces.length)finishGame();
    else {const next=$('tray').querySelector('.piece');if(next)next.focus({preventScroll:true});}
  }else{
    const button=$('tray').querySelector(`[data-piece="${id}"]`);if(button){button.classList.remove('wrong');void button.offsetWidth;button.classList.add('wrong');}
    setStatus(t('wrong'));playSound('wrong');updateProgress();persistGame();
  }
}
function clearHint(){if(runtime.hintTimer){clearTimeout(runtime.hintTimer);runtime.hintTimer=null;}$('slots').querySelectorAll('.hint').forEach(s=>s.classList.remove('hint'));}
function giveHint(){
  const g=runtime.game;if(!g||g.complete||runtime.loading)return;clearHint();
  const id=runtime.selected!==null?runtime.selected:g.order[0];if(id===undefined)return;
  selectPiece(id,true);g.hints++;const slot=$('slots').children[id];slot.classList.add('hint');
  const button=$('tray').querySelector(`[data-piece="${id}"]`);if(button)button.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});
  const mode=labelMode(g.n),l=slotLabel(id,mode);
  setStatus(mode==='aus'?t('hintText'):t('hintTextLabel',{label:l.show}));playSound('hint');if(mode!=='aus')speak(l.say,l.voice);
  runtime.hintTimer=setTimeout(clearHint,5500);persistGame();
}
function updateHelp(){const on=runtime.help;$('board').classList.toggle('show-help',on);$('helpBtn').setAttribute('aria-pressed',String(on));$('helpLabel').textContent=on?t('helpOn'):t('helpOff');}
function cleanupDrag(){
  if(runtime.drag?.button){runtime.drag.button.classList.remove('drag-origin');try{runtime.drag.button.releasePointerCapture(runtime.drag.pointerId);}catch{}}
  if(runtime.ghost){runtime.ghost.remove();runtime.ghost=null;}if(runtime.hoveredSlot)runtime.hoveredSlot.classList.remove('drop-hover');runtime.hoveredSlot=null;runtime.drag=null;
}
function onPiecePointerDown(event,id,button){
  if(event.button!==0||runtime.loading||runtime.game.complete||runtime.drag)return;
  runtime.drag={id,button,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,active:false};
  try{button.setPointerCapture(event.pointerId);}catch{}
  if(runtime.sound&&runtime.audio?.state==='suspended')runtime.audio.resume().catch(()=>{});
}
function slotAt(x,y){
  const el=document.elementFromPoint(x,y),slot=el?.closest('.slot');
  return slot&&!slot.disabled&&slot.parentElement===$('slots')?slot:null;
}
function startDrag(d){
  d.active=true;selectPiece(d.id,true);d.button.classList.add('drag-origin');
  const g=runtime.game,p=g.pieces[d.id],ghost=document.createElement('div');ghost.className='drag-ghost';
  const clone=document.createElement('canvas');clone.width=p.canvas.width;clone.height=p.canvas.height;clone.getContext('2d').drawImage(p.canvas,0,0);ghost.append(clone);
  const mode=labelMode(g.n);if(saved.pieceLabels&&mode!=='aus')ghost.append(labelElement(d.id,mode,'piece-label'));
  const boardSize=$('board').getBoundingClientRect().width,size=boardSize/g.n*1.47;ghost.style.width=size+'px';ghost.style.height=size+'px';d.ghostSize=size;runtime.ghost=ghost;document.body.append(ghost);
}
function pointerMove(event){
  const d=runtime.drag;if(!d||event.pointerId!==d.pointerId)return;
  const dx=event.clientX-d.startX,dy=event.clientY-d.startY,tray=$('tray');
  // On the phone the pieces sit in a strip that scrolls sideways: a sideways swipe scrolls it, moving up out of the strip picks the piece.
  if(!d.active&&!d.scrolling&&Math.hypot(dx,dy)>7){
    if(tray.scrollWidth>tray.clientWidth+1&&Math.abs(dx)>Math.abs(dy)){d.scrolling=true;d.scrollStart=tray.scrollLeft;}else startDrag(d);
  }
  if(d.scrolling){event.preventDefault();tray.scrollLeft=d.scrollStart-dx;if(event.clientY<tray.getBoundingClientRect().top-10){d.scrolling=false;startDrag(d);}}
  if(d.active){event.preventDefault();runtime.ghost.style.left=(event.clientX-d.ghostSize/2)+'px';runtime.ghost.style.top=(event.clientY-d.ghostSize/2)+'px';
    const target=slotAt(event.clientX,event.clientY);if(runtime.hoveredSlot&&runtime.hoveredSlot!==target)runtime.hoveredSlot.classList.remove('drop-hover');if(target)target.classList.add('drop-hover');runtime.hoveredSlot=target;
  }
}
function pointerUp(event){
  const d=runtime.drag;if(!d||event.pointerId!==d.pointerId)return;
  const id=d.id,active=d.active,target=active?slotAt(event.clientX,event.clientY):null;
  cleanupDrag();
  if(d.scrolling)runtime.suppressClicksUntil=performance.now()+400;
  if(active){runtime.suppressClicksUntil=performance.now()+400;if(target)tryPlace(id,Number(target.dataset.id));else{selectPiece(id,true);setStatus(t('dragSelected'));}}
}
function showGallery(){
  if(runtime.loading){++runtime.generation;runtime.loading=false;}
  cleanupDrag();clearHint();pauseClock();persistGame();if(runtime.updateReady){reloadForUpdate();return;}runtime.page='gallery';document.body.classList.remove('playing');runtime.paused=false;
  $('gamePage').hidden=true;$('galleryPage').hidden=false;renderGallery();window.scrollTo(0,0);
}
function openDialog(id){if(runtime.loading)return;cleanupDrag();runtime.paused=true;pauseClock();persistGame();$(id).showModal();}
function closeDialog(id){$(id).close();}
function afterDialogClose(){runtime.paused=false;resumeClock();}
function confetti(){
  const layer=$('confetti');layer.replaceChildren();if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const colors=['#b4a3e3','#f6a1bd','#aadfcb','#ffdb94','#a8dbe9'];
  for(let i=0;i<65;i++){const p=document.createElement('i');p.className='confetti';p.style.left=Math.random()*100+'%';p.style.background=colors[i%colors.length];p.style.setProperty('--dx',(Math.random()-.5)*280+'px');p.style.setProperty('--turn',(Math.random()-.5)*1200+'deg');p.style.setProperty('--dur',(2+Math.random()*2)+'s');p.style.setProperty('--delay',Math.random()*.5+'s');layer.append(p);}
  setTimeout(()=>layer.replaceChildren(),5000);
}
function finishGame(){
  pauseClock();const g=runtime.game;g.complete=true;clearHint();$('board').classList.add('complete');
  $('hintBtn').disabled=true;$('shuffleBtn').disabled=true;$('helpBtn').disabled=true;updateProgress();
  const key=ASSETS[g.motif].id+':'+g.n,newStar=!saved.stars.includes(key);if(newStar)saved.stars.push(key);
  saved.resume=null;writeSaved();updateStars();
  const themeId=ASSETS[g.motif].theme,chest=newStar&&routeComplete(themeId,g.n);
  $('winText').textContent=t('winText',{title:motifText(ASSETS[g.motif],'title')});
  $('winPieces').textContent=g.n*g.n;$('winTime').textContent=formatTime(g.elapsed);
  $('winTitle').textContent=t(chest?'treasureFound':'winTitle');if(chest)speak(t('treasureFound'),'schatz');
  document.querySelector('.win-star').innerHTML=chest?chestSvg(true):svgIcon('star');document.querySelector('.win-star').classList.toggle('treasure',chest);
  $('winAward').textContent=chest?t('winChest',{world:themeText(themeOf(themeId),'title'),n:g.n*g.n}):t(newStar?'winNewStar':'winAgain');
  setStatus(t('winStatus'));playSound('win');confetti();runtime.paused=true;$('winDialog').showModal();
}
// Switching the language redraws everything visible; a running game keeps its pieces and time.
function applyLanguage(){
  applyStaticTexts();$('langCode').textContent=currentLanguage.short;$('langSelect').value=currentLanguage.id;
  $('lettersSample').textContent=lettersOf(currentLanguage).slice(0,3).map(l=>l.letter).join(' ');
  updateSound();if(!storageAvailable)$('storageNote').textContent=t('storageSession');pickVoices();
  if(runtime.page==='gallery'||!runtime.game){renderGallery();return;}
  const g=runtime.game,asset=ASSETS[g.motif],mode=labelMode(g.n);
  $('gameTitle').textContent=motifText(asset,'title');$('gameSubtitle').textContent=t('gameSubtitle',{n:g.n*g.n});$('previewImg').alt=motifText(asset,'alt');
  [...$('slots').children].forEach((slot,id)=>{const label=slot.querySelector('.slot-label');if(label)label.innerHTML=slotLabel(id,mode).html;});
  updateHelp();if(runtime.loading)return;
  renderBoard();renderTray();updateProgress();setStatus(g.complete?t('winStatus'):t(runtime.selected===null?'startHint':'pieceSelected'));
}
function init(){
  initStore();readSaved();setLanguage(saved.lang||detectLanguage());runtime.sound=saved.sound;
  $('langSelect').replaceChildren(...LANGUAGES.map(l=>{const o=document.createElement('option');o.value=l.id;o.lang=l.id;o.textContent=l.name;return o;}));
  applyLanguage();
  $('langSelect').addEventListener('change',()=>{setLanguage($('langSelect').value);saved.lang=currentLanguage.id;writeSaved();applyLanguage();});
  if(!storageAvailable)$('storageNote').textContent=t('storageSession');
  document.querySelectorAll('.level').forEach(button=>button.addEventListener('click',()=>{saved.level=Number(button.dataset.n);writeSaved();renderGallery();}));
  document.querySelectorAll('.mode').forEach(button=>button.addEventListener('click',()=>{saved.labels=button.dataset.mode;writeSaved();updateLabelOptions();}));
  $('pieceLabelsBtn').addEventListener('click',()=>{saved.pieceLabels=!saved.pieceLabels;writeSaved();updateLabelOptions();});
  $('heroPlay').addEventListener('click',()=>{runtime.heroStarted=true;syncHeroVideo();});
  $('soundBtn').addEventListener('click',()=>{runtime.sound=!runtime.sound;saved.sound=runtime.sound;updateSound();writeSaved();if(runtime.sound)playSound('correct');});
  $('homeBtn').addEventListener('click',showGallery);$('backBtn').addEventListener('click',showGallery);
  $('resumeBtn').addEventListener('click',()=>{const r=saved.resume;if(r)startGame(r.motif,r.n,r);});
  $('helpBtn').addEventListener('click',()=>{runtime.help=!runtime.help;updateHelp();});
  $('hintBtn').addEventListener('click',giveHint);
  $('shuffleBtn').addEventListener('click',()=>{if(runtime.game&&!runtime.loading&&!runtime.game.complete){cleanupDrag();runtime.game.order=shuffled(runtime.game.order);renderTray();setStatus(t('shuffled'));persistGame();}});
  $('previewBtn').addEventListener('click',()=>openDialog('previewDialog'));
  $('closePreview').addEventListener('click',()=>closeDialog('previewDialog'));$('continuePreview').addEventListener('click',()=>closeDialog('previewDialog'));
  $('restartBtn').addEventListener('click',()=>openDialog('restartDialog'));
  $('closeRestart').addEventListener('click',()=>closeDialog('restartDialog'));$('cancelRestart').addEventListener('click',()=>closeDialog('restartDialog'));
  $('confirmRestart').addEventListener('click',()=>{const g=runtime.game;closeDialog('restartDialog');$('helpBtn').disabled=false;startGame(g.motif,g.n);});
  $('closeWin').addEventListener('click',()=>closeDialog('winDialog'));
  $('winHome').addEventListener('click',()=>{closeDialog('winDialog');showGallery();});
  $('nextPuzzle').addEventListener('click',()=>{const g=runtime.game;closeDialog('winDialog');$('helpBtn').disabled=false;
    // Continue along the treasure route: the next picture without a star at this piece count, otherwise simply the next one.
    const list=themeMotifs(ASSETS[g.motif].theme),at=list.indexOf(g.motif),ahead=list.slice(at+1).concat(list.slice(0,at+1));
    startGame(ahead.find(i=>!saved.stars.includes(`${ASSETS[i].id}:${g.n}`))??ahead[0],g.n);});
  ['previewDialog','restartDialog','winDialog'].forEach(id=>$(id).addEventListener('close',afterDialogClose));
  window.addEventListener('pointermove',pointerMove,{passive:false});window.addEventListener('pointerup',pointerUp);
  window.addEventListener('pointercancel',event=>{if(runtime.drag&&event.pointerId===runtime.drag.pointerId)cleanupDrag();});
  window.addEventListener('keydown',event=>{if(event.key==='Escape'){cleanupDrag();if(runtime.page==='game'&&!runtime.paused)selectPiece(null);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cleanupDrag();pauseClock();persistGame();}else resumeClock();syncHeroVideo();});
  window.addEventListener('pagehide',()=>{pauseClock();persistGame();});window.addEventListener('pageshow',()=>resumeClock());
  window.addEventListener('resize',()=>{cleanupDrag();if(runtime.page==='gallery'&&($('route').clientWidth<560)!==runtime.mapNarrow)renderRoute();});
  setInterval(()=>{if(runtime.page==='game'&&runtime.game)$('timeStat').textContent=formatTime(elapsedNow());},500);
  runtime.saveTimer=setInterval(()=>{if(runtime.game&&!runtime.game.complete&&runtime.page==='game')persistGame();},10000);
  initWebApp();
}
// Home-screen web app: offline cache, install hint for iPhone/iPad, no accidental zooming.
const INSTALL_HINT_KEY='sternenpuzzle.installHintHidden';
function reloadForUpdate(){pauseClock();persistGame();location.reload();}
// Inside the Google Play / App Store app (Capacitor) all files ship with the app: no service worker, no install hint.
function isNativeApp(){return !!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());}
function isStandalone(){return isNativeApp()||navigator.standalone===true||window.matchMedia('(display-mode: standalone)').matches;}
function isAppleMobile(){return /iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);}
function initWebApp(){
  if(!isNativeApp()&&'serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
    // A new version takes over: reload right away on the start page, otherwise when returning to it.
    const hadController=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||runtime.updateReady)return;runtime.updateReady=true;if(runtime.page==='gallery')reloadForUpdate();});
    navigator.serviceWorker.register('sw.js').then(registration=>{
      // iOS resumes home-screen apps without a new page load, so look for updates when the app comes back.
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)registration.update().catch(()=>{});});
    }).catch(()=>{});
  }
  let hintHidden=false;try{hintHidden=localStorage.getItem(INSTALL_HINT_KEY)==='1';}catch{}
  $('installHint').hidden=hintHidden||isStandalone()||!isAppleMobile();
  $('installHintClose').addEventListener('click',()=>{$('installHint').hidden=true;try{localStorage.setItem(INSTALL_HINT_KEY,'1');}catch{}});
  if(isStandalone()){document.documentElement.classList.add('standalone');['gesturestart','gesturechange'].forEach(type=>document.addEventListener(type,event=>event.preventDefault()));}
  initBackButton();initEdgeSwipe();
}
// Android back button or gesture: close an open dialog, leave the game for the gallery, only on the start page leave the app.
// Without this listener Capacitor closes the whole app, which looks like a crash to a child.
function initBackButton(){
  const cap=window.Capacitor;if(!isNativeApp())return;
  let app=null;try{app=cap.Plugins&&cap.Plugins.App||(cap.registerPlugin?cap.registerPlugin('App'):null);}catch{}
  if(!app)return;
  app.addListener('backButton',()=>{
    const open=document.querySelector('dialog[open]');
    if(open)open.close();else if(runtime.page==='game')showGallery();else app.minimizeApp();
  });
}
// iOS has no system back gesture inside the app: swiping in from the left edge leaves the game for the gallery, like the back button.
// The page follows the finger; a short, slow swipe springs back.
function initEdgeSwipe(){
  const cap=window.Capacitor;if(!isNativeApp()||!(cap.getPlatform&&cap.getPlatform()==='ios'))return;
  const EDGE=24,page=$('gamePage');let swipe=null;
  const canSwipe=x=>x<=EDGE&&runtime.page==='game'&&!runtime.drag&&!document.querySelector('dialog[open]');
  const slide=(x,ms)=>{page.style.transition=ms?`transform ${ms}ms ease-out`:'none';page.style.transform=x?`translateX(${x})`:'';};
  // Capture phase: a touch at the edge must not also pick up a piece. A plain tap still clicks.
  window.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'&&canSwipe(event.clientX))event.stopPropagation();},true);
  window.addEventListener('touchstart',event=>{
    const touch=event.touches[0];swipe=null;
    if(event.touches.length===1&&canSwipe(touch.clientX))swipe={x:touch.clientX,y:touch.clientY,t:event.timeStamp,dx:0,active:false};
  },{passive:true});
  window.addEventListener('touchmove',event=>{
    if(!swipe)return;const touch=event.touches[0],dx=touch.clientX-swipe.x,dy=touch.clientY-swipe.y;
    if(!swipe.active){if(Math.hypot(dx,dy)<8)return;if(dx<=Math.abs(dy)){swipe=null;return;}swipe.active=true;}
    event.preventDefault();swipe.dx=Math.max(0,dx);slide(swipe.dx+'px',0);
  },{passive:false});
  const end=event=>{
    const s=swipe;swipe=null;if(!s||!s.active)return;
    const fast=s.dx>40&&s.dx/(event.timeStamp-s.t)>.5;
    if(event.type==='touchend'&&(s.dx>window.innerWidth*.3||fast)){slide('100vw',180);setTimeout(()=>{showGallery();slide('',0);},180);}
    else slide('',200);
  };
  window.addEventListener('touchend',end);window.addEventListener('touchcancel',end);
}
// In-app purchase "Alle Welten" (Google Play Billing / StoreKit through @capgo/native-purchases).
// A parental gate comes first, as both stores require for kids' apps.
function purchasePlugin(){const cap=window.Capacitor;if(!isNativeApp())return null;
  try{return cap.Plugins&&cap.Plugins.NativePurchases||(cap.registerPlugin?cap.registerPlugin('NativePurchases'):null);}catch{return null;}}
const ownsUnlock=tx=>tx&&tx.productIdentifier===UNLOCK_PRODUCT&&!tx.revocationDate&&(tx.purchaseState===undefined||tx.purchaseState==='1'||tx.purchaseState==='PURCHASED');
function setUnlocked(on){
  if(store.unlocked===on)return;store.unlocked=on;
  try{if(on)localStorage.setItem(UNLOCK_KEY,'1');else localStorage.removeItem(UNLOCK_KEY);}catch{}
  if(runtime.page==='gallery')renderGallery();
}
// Asks the store what this account owns. Only a successful answer changes the state, so offline play keeps the cache.
async function refreshPurchases(){
  const plugin=purchasePlugin();if(!plugin)return false;
  const {purchases=[]}=await plugin.getPurchases({productType:'inapp'});
  const owned=purchases.some(ownsUnlock);setUnlocked(owned);return owned;
}
async function loadPrice(){
  const plugin=purchasePlugin();if(!plugin||store.price)return;
  try{const {products=[]}=await plugin.getProducts({productIdentifiers:[UNLOCK_PRODUCT],productType:'inapp'});
    store.price=products[0]&&products[0].priceString||'';updateBuyButton();}catch{}
}
function updateBuyButton(){$('buyBtn').textContent=store.price?t('buy',{price:store.price}):t('buyNoPrice');$('buyBtn').disabled=store.busy;$('restoreBtn').disabled=store.busy;}
function newGate(){
  const a=3+Math.floor(Math.random()*7),b=3+Math.floor(Math.random()*7);store.gate=a*b;
  $('gateQuestion').textContent=t('gateQuestion',{a,b});$('gateAnswer').value='';
}
function openUnlock(){
  if(!purchasePlugin())return;
  $('unlockGate').hidden=false;$('unlockShop').hidden=true;$('gateError').hidden=true;$('unlockStatus').textContent='';newGate();
  const locked=activeThemes().filter(theme=>themeLocked(theme.id));
  $('unlockNote').textContent=t('unlockNote',{worlds:locked.length,pictures:locked.reduce((sum,theme)=>sum+themeMotifs(theme.id).length,0)});
  updateBuyButton();openDialog('unlockDialog');$('gateAnswer').focus();loadPrice();
}
function checkGate(){
  if(Number($('gateAnswer').value.trim())===store.gate){$('unlockGate').hidden=true;$('unlockShop').hidden=false;$('buyBtn').focus();return;}
  $('gateError').hidden=false;newGate();$('gateAnswer').focus();
}
async function storeAction(action){
  const plugin=purchasePlugin();if(!plugin||store.busy)return;
  store.busy=true;updateBuyButton();$('unlockStatus').textContent=t('unlockWorking');
  let message;
  try{
    if(action==='buy'){const tx=await plugin.purchaseProduct({productIdentifier:UNLOCK_PRODUCT,productType:'inapp',quantity:1});
      if(ownsUnlock(tx))setUnlocked(true);else await refreshPurchases();message=store.unlocked?'unlockDone':'unlockFailed';}
    else{await plugin.restorePurchases();message=await refreshPurchases()?'unlockDone':'restoreNone';}
  }catch{message=action==='buy'?'unlockFailed':'unlockUnavailable';}
  store.busy=false;updateBuyButton();$('unlockStatus').textContent=t(message);
  if(store.unlocked)setTimeout(()=>closeDialog('unlockDialog'),1400);
}
function initStore(){
  const demo=document.documentElement.hasAttribute('data-demo');$('demoNote').hidden=!demo;
  [['storePlay','play'],['storeApple','apple']].forEach(([id,key])=>{const link=$(id);link.hidden=!STORE_LINKS[key];if(STORE_LINKS[key])link.href=STORE_LINKS[key];});
  $('closeUnlock').addEventListener('click',()=>closeDialog('unlockDialog'));$('cancelUnlock').addEventListener('click',()=>closeDialog('unlockDialog'));
  $('gateOk').addEventListener('click',checkGate);$('gateAnswer').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();checkGate();}});
  $('buyBtn').addEventListener('click',()=>storeAction('buy'));$('restoreBtn').addEventListener('click',()=>storeAction('restore'));
  $('unlockDialog').addEventListener('close',afterDialogClose);
  if(!purchasePlugin())return;
  try{store.unlocked=localStorage.getItem(UNLOCK_KEY)==='1';}catch{}
  refreshPurchases().catch(()=>{});
}
// Export only deterministic helpers for local tests; not needed by the player.
window.SternenpuzzleTest={generatePieces,puzzlePath,seededRandom,shuffled,formatTime,sanitizeSave,slotLabel};
init();
