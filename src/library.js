import {libraryBooks} from './data/library-books.js';
import {escapeHTML as h} from './logic.js';
function picture(book){
 return `<div class="library-illustration" role="img" aria-label="${h(book.subtitle)} · 창작 삽화"><span class="library-picture-fallback" aria-hidden="true">${['🏯','🍓','🎨','🏺','🏮'][book.scene]}</span><img class="library-atlas" alt="" aria-hidden="true" src="${import.meta.env.BASE_URL}illustrations/jinju-books.webp" style="left:-${book.scene%3*100}%;top:-${Math.floor(book.scene/3)*100}%" decoding="async"></div>`;
}
function mount(root){
 root.querySelectorAll('.library-atlas').forEach(img=>{
  const ready=async()=>{try{await img.decode();if(img.isConnected)img.classList.add('ready')}catch{img.remove()}};
  img.addEventListener('load',ready,{once:true});img.addEventListener('error',()=>img.remove(),{once:true});if(img.complete&&img.naturalWidth)ready();
 });
}
export function showLibrary({ui,state,persist},bookId=null,pageIndex=0){
 const options={ui,state,persist},book=libraryBooks.find(b=>b.id===bookId);
 if(!book){
  const root=ui.open('도서관 · 진주 이야기 다섯 권',`<p class="eyebrow">오늘은 어떤 책을 읽을까요?</p><p>읽고 싶은 책을 골라요. 퀴즈나 미션 없이 자유롭게 읽을 수 있어요.</p><div class="library-shelf">${libraryBooks.map(b=>`<button class="library-book" data-library-book="${b.id}" style="--book-color:${b.color}">${picture(b)}<span class="library-book-title">${h(b.title)}</span><small>${h(b.subtitle)}</small></button>`).join('')}</div><p class="small">수업용 제공 자료를 어린이용으로 다시 썼어요. 그림은 내용을 떠올리도록 만든 창작 삽화예요.</p>`,'wide');
  mount(root);root.querySelectorAll('[data-library-book]').forEach(b=>b.onclick=()=>showLibrary(options,b.dataset.libraryBook));return;
 }
 const index=Math.max(0,Math.min(book.pages.length-1,pageIndex)),page=book.pages[index];
 const root=ui.open(book.title,`<article class="library-reader" data-reading-book="${book.id}" data-book-page="${index}"><div>${picture(book)}<p class="small">내용을 떠올리기 위한 창작 삽화</p></div><div><p class="eyebrow">${h(book.subtitle)} · ${index+1} / ${book.pages.length}쪽</p><h3>${h(page.title)}</h3><p class="reading-copy">${h(page.text)}</p><aside class="book-imagine"><b>함께 생각해 봐요</b><p>${h(page.situation)}</p></aside></div></article><div class="actions"><button id="book-prev" ${index===0?'disabled':''}>← 앞쪽</button><button id="book-next" class="primary">${index===book.pages.length-1?'다 읽었어요 · 책장으로':'다음 쪽 →'}</button><button id="book-shelf">다른 책 고르기</button></div><details class="book-sources"><summary>이 책의 자료 안내</summary><p class="small">${h(book.sourceTitle)} · ${h(book.reviewStatus)}</p>${book.references.map(r=>`<a href="${h(r.url)}" target="_blank" rel="noopener noreferrer">${h(r.title)} ↗</a>`).join(' · ')}</details>`,'wide');
 mount(root);const record=`library:${book.id}:${index}`;if(!state.read.includes(record)){state.read.push(record);persist()}
 root.querySelector('#book-prev').onclick=()=>showLibrary(options,book.id,index-1);root.querySelector('#book-next').onclick=()=>showLibrary(options,index===book.pages.length-1?null:book.id,index+1);root.querySelector('#book-shelf').onclick=()=>showLibrary(options);
}
