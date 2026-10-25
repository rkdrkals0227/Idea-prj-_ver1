// Original vector illustrations; no external image requests or model APIs.
function vectorIllustration(page=0){
 const dragon=(x,y,color,flip=1)=>`<g transform="translate(${x} ${y}) scale(${flip} 1)"><path d="M-90 35Q-65-20-20 18T65-12" fill="none" stroke="${color}" stroke-width="34" stroke-linecap="round"/><path d="M-84 30Q-53-8-20 24T48 1" fill="none" stroke="#fff1bd" stroke-width="13" stroke-linecap="round"/><ellipse cx="64" cy="-18" rx="34" ry="27" fill="${color}"/><path d="M44-39L42-60L58-43M72-42L86-60L85-35" fill="#f2d599"/><circle cx="76" cy="-22" r="4" fill="#344d5e"/><path d="M81-7q14 5 23-7" fill="none" stroke="#496565" stroke-width="3" stroke-linecap="round"/><path d="M42 2L27 27M1 16L-10 42" stroke="${color}" stroke-width="13" stroke-linecap="round"/></g>`;
 const village=`<g fill="#eee1ba" stroke="#967653" stroke-width="2"><path d="M25 235v-40h53v40M105 243v-40h60v40"/><path d="M18 195l34-28 35 28M98 203l36-28 38 28" fill="#d79376"/><path d="M44 235v-21h15v21M128 243v-23h15v23" fill="#b1bd99"/></g>`;
 const hero=`<g transform="translate(230 175)"><path d="M-30 95l8-58h45l12 58" fill="#b76c57"/><path d="M-19 47L-48 20M21 47L56 10" stroke="#b76c57" stroke-width="14" stroke-linecap="round"/><circle cy="17" r="23" fill="#f3d7ab"/><path d="M-26 12q1-40 48-7" fill="#6f8074"/><circle cx="-7" cy="16" r="2"/><circle cx="7" cy="16" r="2"/><path d="M-7 28q7 5 14 0" fill="none" stroke="#a06c55" stroke-width="2"/><path d="M-18 95l-5 17M23 95l5 17" stroke="#626f66" stroke-width="13" stroke-linecap="round"/></g>`;
 const scenes=[
 `${dragon(148,183,'#6aafbc')}${dragon(330,204,'#e2bb62',-1)}${village}`,
 `${dragon(120,173,'#6aafbc')}${dragon(358,181,'#e2bb62',-1)}<path d="M221 132l-12 24 28-8-13 32" fill="none" stroke="#e0a276" stroke-width="5"/>`,
 `${dragon(210,140,'#6aafbc')}<path d="M88 242q42-55 86 0t86 0t86 0" fill="none" stroke="#b2d9d9" stroke-width="10"/><path d="M153 199l-20 21M181 189l-4 27M210 195l17 22" stroke="#efe4bd" stroke-width="7"/>`,
 `${dragon(100,156,'#6aafbc')}${dragon(375,157,'#e2bb62',-1)}${hero}`,
 `${dragon(150,227,'#6aafbc')}${dragon(345,105,'#e2bb62',-1)}<path d="M280 130q80-110 120-110" fill="none" stroke="#f4dfad" stroke-width="5" stroke-dasharray="5 10"/>`,
 `${dragon(170,225,'#6aafbc')}${hero}<g transform="translate(353 247)"><ellipse rx="30" ry="18" fill="#7f9c74"/><circle cx="30" cy="-3" r="10" fill="#a3b38d"/><path d="M-15-8l17-9 14 10-5 15h-22z" fill="none" stroke="#607f62" stroke-width="3"/></g>`,
 ];
 return `<svg viewBox="0 0 480 340" role="img" aria-label="금호지의 두 용 이야기 ${page+1}장 그림" xmlns="http://www.w3.org/2000/svg"><rect width="480" height="340" rx="28" fill="#eee8ce"/><circle cx="395" cy="54" r="31" fill="#f8edb8"/><path d="M0 174Q65 40 133 150Q209 10 290 155Q377 62 480 176v164H0Z" fill="#aab99a"/><path d="M0 205Q95 171 192 208T480 194v146H0Z" fill="#c7d1a9"/><ellipse cx="246" cy="278" rx="218" ry="58" fill="#90bfc2"/><path d="M69 280q45-11 85 0m70 18q55-11 105 0m34-25q35-9 65-1" fill="none" stroke="#d6e3cf" stroke-width="4" stroke-linecap="round"/>${scenes[page%scenes.length]}<g fill="#faf1d9" opacity=".55"><circle cx="34" cy="43" r="2"/><circle cx="70" cy="94" r="3"/><circle cx="291" cy="41" r="2"/></g></svg>`;
}

// Locally hosted atlas: three columns, two rows. The original vectors remain a
// readable fallback if an image cannot load; no external runtime service is used.
const sceneDescriptions=[
 '푸른 산과 옛 마을 앞에서 청룡과 황룡이 만나요.',
 '청룡과 황룡이 하늘에서 서로 다투고 있어요.',
 '청룡의 꼬리가 닿은 깊은 땅에 물이 고여요.',
 '장군이 손을 들어 두 용의 다툼을 말려요.',
 '청룡은 호수를 지키고 황룡은 구름 위로 올라가요.',
 '아이들이 안전한 길에서 쓰레기를 줍고 호수를 아껴요.',
];
export function storyIllustration(page=0,pageId=`legend-${page+1}`){
 const scene=sceneDescriptions[page];
 if(!scene||pageId!==`legend-${page+1}`)return vectorIllustration(0);
 const url=`${import.meta.env.BASE_URL}illustrations/geumho-story.webp`;
 return `<div class="story-scene" data-story-scene="${page}" role="img" aria-label="${scene}"><div class="story-fallback" aria-hidden="true">${vectorIllustration(page)}</div><img class="story-atlas" alt="" aria-hidden="true" src="${url}" style="left:-${page%3*100}%;top:-${Math.floor(page/3)*100}%" decoding="async"></div>`;
}
export function mountStoryIllustration(root){
 const img=root.querySelector('.story-atlas');
 if(!img)return;
 const ready=()=>{if(img.naturalWidth>0)img.classList.add('ready')};
 img.addEventListener('load',ready,{once:true});
 img.addEventListener('error',()=>img.remove(),{once:true});
 if(img.complete)ready();
}
