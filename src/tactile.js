export function validateTactile(t) {
 const fail=()=>{throw new Error('안내 블록의 칸 수·행/열 위치·연결·방향을 확인해 주세요. 2~24칸과 90도 단위 방향을 사용해요.')};
 if(!t||typeof t.text!=='string'||!Array.isArray(t.solution)||t.solution.length<2||t.solution.length>24||t.solution.some(c=>!c||!['dot','line'].includes(c.type)||!Number.isFinite(c.rotation)||c.rotation%90!==0))fail();
 for(const key of ['cols','rows'])if(t[key]!==undefined&&(!Number.isInteger(t[key])||t[key]<2||t[key]>8))fail();
 if(t.layoutVersion===undefined){if(t.solution.some(c=>c.col!==undefined||c.row!==undefined))fail();return}
 if(t.layoutVersion!==2||!Number.isInteger(t.cols)||!Number.isInteger(t.rows))fail();
 const cells=new Set();
 t.solution.forEach((c,i)=>{
  if(!Number.isInteger(c.col)||!Number.isInteger(c.row)||c.col<0||c.col>=t.cols||c.row<0||c.row>=t.rows)fail();
  const key=`${c.col},${c.row}`;if(cells.has(key))fail();cells.add(key);
  const prev=t.solution[i-1],next=t.solution[i+1];
  if(prev&&Math.abs(c.col-prev.col)+Math.abs(c.row-prev.row)!==1)fail();
  if(c.type==='line'){
   if(!prev||!next)fail();
   const horizontal=prev.row===c.row&&next.row===c.row,vertical=prev.col===c.col&&next.col===c.col;
   if(!horizontal&&!vertical)fail();
   if(((c.rotation%180)+180)%180!==(horizontal?0:90))fail();
  }
 });
}
