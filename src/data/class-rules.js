// September meeting decisions by class 4-4 pupils. Year/day were not provided.
export const classRules = {
  month: '9월', source: '9월 학급 회의에서 4-4반 아이들이 정한 약속',
  rules: [
    {id:'self-talk',group:'나를 위한 규칙',text:'싸울 경우, 말로 풀기'},
    {id:'self-break',group:'나를 위한 규칙',text:'쉬는 시간 되자마자 떠들지 않기'},
    {id:'group-respect',group:'모둠을 위한 규칙',text:'모둠 친구 방해하지 않기'},
    {id:'class-respect',group:'학급을 위한 규칙',text:'선생님께 버릇없이 말하지 않기'},
  ],
};
export const expandedTactile = {
  layoutVersion:2, cols:8, rows:4, routeId:'school-apartment-v1',
  text:'금호초등학교 문 앞에서 모퉁이를 돌아 햇살 아파트까지 이어지는 길이에요. 각 칸은 길의 한 구간을 줄여 나타내요. 선형은 방향을, 점형은 주의를 살펴보는 게임용 체험이며 실제 시설 수리는 담당 기관이 해요.',
  solution:[
    {col:0,row:0,type:'dot',rotation:0},
    {col:0,row:1,type:'line',rotation:90},
    {col:0,row:2,type:'line',rotation:90},
    {col:0,row:3,type:'dot',rotation:0},
    {col:1,row:3,type:'line',rotation:0},
    {col:2,row:3,type:'line',rotation:0},
    {col:3,row:3,type:'line',rotation:0},
    {col:4,row:3,type:'line',rotation:0},
    {col:5,row:3,type:'line',rotation:0},
    {col:6,row:3,type:'line',rotation:0},
    {col:7,row:3,type:'dot',rotation:0},
  ],
};
