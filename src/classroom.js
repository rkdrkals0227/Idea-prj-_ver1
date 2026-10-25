export function normalizeRule(text) {
  return String(text ?? '').normalize('NFKC').replace(/[^\p{L}\p{M}\p{N}]/gu,'');
}
export function rulesComplete(state,content) {
  return (content.classRules?.rules || []).every(r=>normalizeRule(state.journey.ruleCopies?.[r.id])===normalizeRule(r.text));
}
export function copyRule(state,id,text,content) {
  const rule=content.classRules?.rules.find(r=>r.id===id);
  if(!rule)return false;
  const expected=normalizeRule(rule.text);
  const withoutList=String(text??'').normalize('NFKC').replace(/^\s*[\p{P}\p{S}]*\s*\p{N}+\s*(?:번)?[\p{P}\p{S}\s]*/u,'');
  if(normalizeRule(text)!==expected && normalizeRule(withoutList)!==expected)return false;
  state.journey.ruleCopies ||= {};
  state.journey.ruleCopies[id]=rule.text;
  return true;
}
export function validateClassRules(value) {
  if(!value || typeof value.month!=='string' || !Array.isArray(value.rules) || !value.rules.length || value.rules.length>12 || new Set(value.rules.map(r=>r.id)).size!==value.rules.length || value.rules.some(r=>!r || !['id','group','text'].every(k=>typeof r[k]==='string'&&r[k].trim()&&r[k].length<=150)))throw new Error('학급 규칙의 날짜·고유 ID·구분·문장을 확인해 주세요.');
}
