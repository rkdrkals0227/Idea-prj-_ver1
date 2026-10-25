// Teacher-supplied September meeting. The year/day were not provided.
export const classRules = {
  month: '9월', source: '선생님이 제공한 학급 회의 결과',
  rules: [
    {id:'self-talk',group:'나를 위한 규칙',text:'싸울 경우, 말로 풀기'},
    {id:'self-break',group:'나를 위한 규칙',text:'쉬는 시간 되자마자 떠들지 않기'},
    {id:'group-respect',group:'모둠을 위한 규칙',text:'모둠 친구 방해하지 않기'},
    {id:'class-respect',group:'학급을 위한 규칙',text:'선생님께 버릇없이 말하지 않기'},
  ],
};
export const expandedTactile = {
  layoutVersion:2, cols:5, rows:3,
  text:'학교 앞에서 모퉁이를 돌아 이어지는 길이에요. 선형은 이동 방향, 점형은 주의·방향이 바뀌는 곳을 살펴보는 게임용 표시예요. 실제 설계·시공 기준은 아니며 시설 수리는 담당 기관이 해요.',
  solution:[
    {col:0,row:0,type:'dot',rotation:0},
    {col:1,row:0,type:'line',rotation:0},
    {col:2,row:0,type:'line',rotation:0},
    {col:3,row:0,type:'line',rotation:0},
    {col:4,row:0,type:'dot',rotation:0},
    {col:4,row:1,type:'line',rotation:90},
    {col:4,row:2,type:'dot',rotation:0},
    {col:3,row:2,type:'line',rotation:0},
    {col:2,row:2,type:'line',rotation:0},
    {col:1,row:2,type:'line',rotation:0},
    {col:0,row:2,type:'dot',rotation:0},
  ],
};
