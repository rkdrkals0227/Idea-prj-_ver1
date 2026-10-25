# 실제 업로드 모델 연결

2026-10-25 최신 첨부30개를 모두 수신해 연결했습니다. 이전 첨부의 용량 제한은 이번 축소 파일로 해소되었습니다. 원본은 수정하지 않고 웹용 사본을 `public/models/uploaded/`에 저장합니다. `provenance.json`에 원본 파일명·용량·실제 애니메이션 이름을 기록합니다.

## 파일 대응

| 게임 역할 | 첨부 파일 | 상태/배치 |
|---|---|---|
| player | 01_appleking_stop / walk | 정지 원본, 이동은 파일의 실제 Running 클립 |
| otter | 02_otter_stop / walk / hi 계열 | 정지, Walking, Big_Wave_Hello |
| turtle | 03_turtle_stop / walk / hi 계열 | 정지, Walking, Big_Wave_Hello |
| crane | 04_학 정지 / bird_walk / bird_hi | 이번 실제 정지 파일, Walking, Big_Wave_Hello |
| school / library / apartment | 05_place_school / 06_place_library / 07_place_apartment | 기존 위치·충돌 크기에 비율 유지 정규화. 학교/도서관 앞 입구 표시와 출입 유지 |
| lake | 08_place_lake | 금호지 경계 안에 배치. 임시 호수는 로딩 성공 후 숨김 |
| tree | 09_tree | 기존 나무 위치에 공유 재질/메시로 반복 배치 |
| lamp / bench / sign | 10_light / 11_bench / 12_Information Sign | 가로등·벤치 적용. 표지판 GLB는 보관만 하고 이름은 근접 말풍선으로 표시 |
| tactile / tactileBroken | 13_Braille blocks / 15_Braille block_broken | 안내 길 정상/파손 위치, 수리하면 정상 모형으로 변경 |
| fence | 14_시설물_울타리 | 학교 뒤와 주택가 뒤. 통학로·출입·전시 공간을 막지 않는 위치에 충돌 포함 |
| paving / grass | 16_tile / 17_garden tile | 보도·풀밭 반복 인스턴스 |
| wastePaper / Bottle / Can / Wrapper | 18_1 / 18_2 / 18_3 / 18_4 | 기존 수거물과 안내 길 방해물 ID, 완료하면 숨김 |
| lotusWater / water | 19_water tile_with flower / 20_water tile | 남강 축약 하천에 반복 배치. 실제 금호지 모델의 장식과 겹치는 호수 타일 격자는 제거 |

주민 NPC는 otter/turtle/crane **각1마리, 합계3마리**만 생성합니다. 우체부·주택가 주민·생태 안내원 캐릭터는 제거했습니다. 해당 활동은 우체통, 아파트 생활 메뉴, 남생이 돌봄 대화로 유지하며 기존 퀘스트·퀴즈·편지 저장 ID는 바꾸지 않습니다. 편지 접수 뒤에는 추가 NPC 없이 봉투가 이동합니다. 학생 그림 작품은 NPC와 별개로 유지합니다.

세 친구는 manifest의 `patrol.points`와 `speed`를 따라 몇 미터의 경로를 반복합니다. 개체의 실제 좌표로 E 상호작용·지도·목표 표시를 갱신합니다. 플레이어2.6 이내, 대화/실내/움직임 줄이기 중에는 멈추며 가까운 플레이어를 바라봅니다. 경로는 기존 건물·호수 경계와 겹치지 않게 설정했습니다.

꽃담주택과 물리적인 전시판·생활 게시판·생태 관리소·수거함은 삭제했습니다. 산, 실내와 활동 도구 일부는 기본 도형입니다. 쓰레기 분류는 가방, 작품 전시는 우리 반 생태 지도에서 진행합니다. 학교와 도서관 외관은 업로드 파일, 실내는 기존 수업용 공간입니다.

## 크기·방향·상태 설정

`src/data/asset-manifest.json`에서 public 기준 `url`, `position`, Y축 회전 `rotation`(라디안), `groundHeight`, `collision`을 조정합니다. 역할 ID를 바꾸지 않으면 기존 진행 기록을 유지합니다.

- `targetHeight`: 캐릭터 발부터 머리 높이. 주인공1.7, 수달1.8, 남생이1.5, 학2.0.
- `footprint: [너비, 깊이]`: 건물 비율을 유지하며 충돌 면적 안에 맞춥니다. 학교7×5, 도서관6×5, 아파트8×7, 위치[18,0,-3.2].
- `targetSize`: 가장 긴 변을 맞춥니다.
- `fit: [너비, 높이, 깊이]`: 바닥·호수·울타리 등 지정 영역에 맞춥니다. 금호지는16×0.85×12.
- `variants.idle/walk/greet`: 상태별 파일 `url`과 실제 클립 `clip`. 옛 한 파일의 `animations.idle/walk` 설정도 지원합니다.

걷기 때 이동 방향을 보고, 가까이에서 상호작용하면 인사를 한 번 재생한 뒤 대기로 돌아갑니다. 주민은 제자리 흔들림이 아닌 산책 경로를 이동합니다. 우체부 NPC는 없습니다. 움직임 줄이기는 순찰/대기 움직임을 멈추고 인사만 한 번 보여 줍니다.

GLB/glTF 실패나 외부 텍스처·버퍼 누락 시 해당 상태/모형만 임시 도형으로 복구합니다. glTF는 `.bin`과 텍스처를 원래 상대 경로대로 함께 둡니다. 같은 GLB는 한 번만 요청하고 반복 바닥은 InstancedMesh로 공유합니다.

## 웹 사본 준비

Blender4.3.2와 Pillow로 웹 사본을 준비합니다. 학교·도서관·아파트는 원본 정점·인덱스 버퍼를 보존하고 텍스처만1024px로 줄입니다. 벤치6,500·나무4,000·보도1,800·잔디/물1,500·연꽃물2,500·정상/파손 점자블록3,500삼각형 및1024px 텍스처로 세부 표현을 보완했습니다. 나머지 정적 소품은 기존 예산(기본2,500, 울타리1,200, 호수/정지 동물6,000)을 사용하며 텍스처512px입니다. 움직임 파일은 리그와 애니메이션 버퍼를 유지하고 텍스처만 줄입니다. 반복 바닥·나무는 인스턴스를 공유합니다. `triangleBudget`, `textureSize`, `preserveGeometry`를 작업별로 재정의할 수 있습니다.

작업 목록 JSON은 `[{"name":"school","path":"원본.glb","animated":false}]` 형식입니다.

```bash
blender -b -t 2 --python scripts/prepare-models.py -- /path/to/jobs.json
```

처리하지 않은 기존 역할의 provenance는 유지하고 같은 ID는 최신 기록으로 바꿉니다. 새 모델은 실제 브라우저에서 크기·바닥·정면·충돌·출입과 상태 전환을 확인한 뒤 배포하세요. 낮은 화질은 그림자와 해상도를 줄입니다. 실제 교실 노트북·태블릿 성능은 별도 실기기 확인이 필요합니다.


## 건물 형태 복원 확인

기존6,000면 단순화 때문에 외벽·지붕/창문 형태가 손상된 것을 확인해 원본 메시로 복원했습니다. 학교73,835, 도서관71,399, 아파트75,933 정점이 원본과 같으며 원본 GLB의 모든 접근자 버퍼도 바이트 단위로 일치합니다. `provenance.json`의 `geometryPreserved:true`, `textureSize:1024`가 해당3개에 적용됩니다. 준비 스크립트도 건물3종에는 기본으로 메시 보존을 적용하므로 전체 재처리 때 다시6천 면으로 줄이지 않습니다. 새 화면은 `solid-buildings-three-residents.png`입니다.
