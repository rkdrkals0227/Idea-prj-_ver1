# 금산마을의 느린 산책

이 프로젝트를 위해 직접 작곡·합성한 오리지널 배경음악입니다. 기존 게임 음악, 외부 샘플, 상업 음원, AI 음악 API를 사용하지 않았습니다.

- 84 BPM, 4/4박자, 16마디, 약45.714초. 부드러운 플럭·벨·패드·베이스.
- village-day.ogg: 기본 재생용 약143KB.
- village-day.wav: Ogg 미지원/파일 실패 시 대체하는22,050Hz 스테레오16-bit PCM 원본.
- scripts/compose_bgm.py: 악보와 음색을 함께 담은 제작 소스. 재생에는 Python/ffmpeg가 필요하지 않습니다.
- 다시 만들기: Python3 + numpy + ffmpeg 설치 후 프로젝트 루트에서 `python3 scripts/compose_bgm.py`.
- 발소리, 종이, 정오답, 축하 효과는 src/audio.js에서 Web Audio로 합성합니다.
