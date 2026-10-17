'use strict';
const $ = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let toastTimeout;
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').classList.remove('show'),2800)}
function readStore(key){try{return localStorage.getItem(key)}catch{return null}}
function saveStore(key,value){try{localStorage.setItem(key,value)}catch{}}
function toggleTheme(){const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;saveStore('grygy-theme',next);$('theme').setAttribute('aria-label',next==='dark'?'Přepnout na světlý vzhled':'Přepnout na tmavý vzhled')}
if(readStore('grygy-theme')==='light')document.documentElement.dataset.theme='light';
$('theme').addEventListener('click',toggleTheme);
$('year').textContent=new Date().getFullYear();
// Generative artwork; completely local, responsive and reduced-motion aware.
const canvas=$('hero-canvas'),ctx=canvas.getContext('2d');
let artW=0,artH=0,phase=Math.random()*6,mouse={x:0,y:0},frame=0,artVisible=true;
function resizeArt(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);artW=rect.width;artH=rect.height;canvas.width=Math.round(artW*dpr);canvas.height=Math.round(artH*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);drawArt()}
function drawArt(t=0){if(!ctx)return;ctx.clearRect(0,0,artW,artH);ctx.fillStyle='#d9fa65';ctx.fillRect(0,0,artW,artH);const cx=artW*.54,cy=artH*.48,r=Math.min(artW*.39,artH*.35);ctx.save();ctx.translate(cx+mouse.x*10,cy+mouse.y*10);ctx.rotate(-.35+Math.sin(t*.00014+phase)*.08);for(let i=0;i<44;i++){const p=i/43,rr=r*(.18+p*.82);ctx.beginPath();ctx.ellipse(Math.sin(p*4+phase)*r*.19+mouse.x*p*28,Math.cos(p*3+phase)*r*.1+mouse.y*p*22,rr,rr*(.55+.16*Math.sin(p*3+phase)),p*.75,0,Math.PI*2);ctx.strokeStyle=i%5===0?'#17230a':'#17230aba';ctx.lineWidth=i%5===0?1.8:.8;ctx.stroke()}ctx.restore();ctx.fillStyle='#17230a';ctx.beginPath();ctx.arc(cx+r*.8,cy-r*.65,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#17230a44';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(25,artH*.8);ctx.lineTo(artW-25,artH*.8);ctx.stroke()}
function animate(t){if(artVisible&&!document.hidden)drawArt(t);frame=requestAnimationFrame(animate)}
new ResizeObserver(resizeArt).observe(canvas);
new IntersectionObserver(entries=>{artVisible=entries[0].isIntersecting}).observe(canvas);
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)/r.width-.5;mouse.y=(e.clientY-r.top)/r.height-.5;if(reducedMotion.matches)drawArt()});
canvas.addEventListener('pointerleave',()=>{mouse={x:0,y:0};if(reducedMotion.matches)drawArt()});
$('regenerate').addEventListener('click',()=>{phase=Math.random()*Math.PI*2;drawArt();toast('Nová perspektiva. Stejné hřiště.')});
function motionChanged(){cancelAnimationFrame(frame);if(!reducedMotion.matches)frame=requestAnimationFrame(animate);else drawArt()}
reducedMotion.addEventListener('change',motionChanged);motionChanged();
const palettes=[['#D9FA65','#17230A','#F6F5EB','#C7B9FF','#FF7B54'],['#E9B6FF','#493167','#F5E6FF','#F5A65B','#102B3F'],['#F7E6C4','#E66F51','#23483D','#9FC6B8','#DFB7A7'],['#88D9E6','#183446','#F8F0DA','#F6A6B2','#DCFA70'],['#B4FF9F','#14291C','#F8E7C9','#F18771','#8D80CB']];
let paletteIndex=0;
function renderPalette(){const root=$('swatches');root.replaceChildren();for(const color of palettes[paletteIndex]){const button=document.createElement('button');button.className='swatch';button.style.background=color;button.setAttribute('aria-label','Zkopírovat barvu '+color);const label=document.createElement('span');label.textContent=color;button.append(label);button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(color);toast(color+' zkopírováno')}catch{toast('Kód barvy: '+color)}});root.append(button)}}
function newPalette(){paletteIndex=(paletteIndex+1)%palettes.length;renderPalette()}
$('new-palette').addEventListener('click',newPalette);renderPalette();
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});document.querySelectorAll('.experiment').forEach(card=>card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter)}));
let reactionState='idle',reactionTimeout,reactionStart=0;
const storedBest=Number(readStore('grygy-best'));let best=Number.isFinite(storedBest)&&storedBest>0?storedBest:0;
function showBest(){$('best').textContent='REKORD: '+(best?best+' ms':'—')}showBest();
function setReaction(state,title,help){reactionState=state;$('reaction').className='reaction-zone '+state;$('reaction-title').textContent=title;$('reaction-help').textContent=help}
$('reaction').addEventListener('click',()=>{if(reactionState==='idle'||reactionState==='result'){setReaction('waiting','Ještě ne…','Počkej, až se plocha rozsvítí zeleně.');reactionTimeout=setTimeout(()=>{reactionStart=performance.now();setReaction('ready','TEĎ!','Klikni!')},1300+Math.random()*2600)}else if(reactionState==='waiting'){clearTimeout(reactionTimeout);setReaction('result','Trochu moc brzy.','Klikni a zkus to znovu.')}else if(reactionState==='ready'){const ms=Math.round(performance.now()-reactionStart);if(!best||ms<best){best=ms;saveStore('grygy-best',String(best));showBest()}setReaction('result',ms+' ms',ms<250?'Bleskový postřeh! Další kolo?':'Pěkné! Klikni pro další kolo.')}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(reactionState==='waiting'||reactionState==='ready')){clearTimeout(reactionTimeout);setReaction('idle','Zkusíme to znovu?','Test se při opuštění stránky resetoval.')}});
function updateType(){const text=$('type-input').value;$('type-preview').textContent=text||'Tvůj text.';$('type-preview').style.fontWeight=$('weight').value;$('type-preview').style.fontSize=text.length>22?'42px':''}
$('type-input').addEventListener('input',updateType);$('weight').addEventListener('input',updateType);$('reset-type').addEventListener('click',()=>{$('type-input').value='Make it bold.';$('weight').value='800';updateType()});updateType();
let totalSeconds=1500,remaining=1500,timerRunning=false,deadline=0,timerInterval;
function renderTimer(){const m=Math.floor(remaining/60),s=remaining%60;$('timer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');$('timer-toggle').textContent=timerRunning?'Pozastavit Ⅱ':remaining===0?'Znovu →':'Začít →';$('timer-ring').classList.toggle('running',timerRunning)}
function stopTimer(){timerRunning=false;clearInterval(timerInterval)}
function tick(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));if(remaining===0){stopTimer();toast('Hotovo. Chvilka pauzy ti prospěje.')}renderTimer()}
$('timer-toggle').addEventListener('click',()=>{if(timerRunning){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));stopTimer()}else{if(remaining===0)remaining=totalSeconds;deadline=Date.now()+remaining*1000;timerRunning=true;timerInterval=setInterval(tick,200)}renderTimer()});
function resetTimer(){stopTimer();remaining=totalSeconds;renderTimer()}
$('timer-reset').addEventListener('click',resetTimer);document.querySelectorAll('[data-minutes]').forEach(button=>button.addEventListener('click',()=>{totalSeconds=Number(button.dataset.minutes)*60;resetTimer();document.querySelectorAll('[data-minutes]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))})}));renderTimer();
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&timerRunning)tick()});
const dialog=$('command');$('open-command').addEventListener('click',()=>dialog.showModal());$('close-command').addEventListener('click',()=>dialog.close());
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();dialog.open?dialog.close():dialog.showModal()}});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{dialog.close();switch(button.dataset.command){case 'theme':toggleTheme();break;case 'palette':document.querySelector('[data-filter=all]').click();newPalette();$('swatches').scrollIntoView({block:'center'});toast('Paleta připravena.');break;case 'playground':$('playground').scrollIntoView();break;case 'top':window.scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'});break}}));
