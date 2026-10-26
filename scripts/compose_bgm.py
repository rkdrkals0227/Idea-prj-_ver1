"""Original score: '금산마을의 느린 산책'. Requires numpy and ffmpeg to regenerate.
No samples, borrowed melodies, or external services. Output is a seamless 16-bar loop.
"""
from pathlib import Path
import subprocess, wave
import numpy as np
RATE=22050
BPM=84
BEAT=60/BPM
LENGTH=round(16*4*BEAT*RATE)
mix=np.zeros((LENGTH,2),dtype=np.float64)
def note(midi,beat,duration,amp,voice='pluck',pan=0):
 n=round(duration*BEAT*RATE);t=np.arange(n)/RATE;f=440*2**((midi-69)/12)
 if voice=='pad':
  env=np.minimum(t/.35,1)*np.minimum((n/RATE-t)/.7,1)
  y=(np.sin(2*np.pi*f*t)+.16*np.sin(2*np.pi*f*2*t))*env*.45
 elif voice=='bass':
  y=np.sin(2*np.pi*f*t)*np.minimum(t/.025,1)*np.exp(-t*2.4)
 elif voice=='bell':
  y=(np.sin(2*np.pi*f*t)*np.exp(-t*2.7)+.2*np.sin(2*np.pi*f*3*t)*np.exp(-t*7))*np.minimum(t/.012,1)
 else:
  y=(np.sin(2*np.pi*f*t)+.28*np.sin(2*np.pi*f*2*t)*np.exp(-t*4)+.1*np.sin(2*np.pi*f*3*t)*np.exp(-t*7))*np.exp(-t*3)*np.minimum(t/.008,1)
 y*=np.minimum((n/RATE-t)/.03,1)*amp
 idx=(round(beat*BEAT*RATE)+np.arange(n))%LENGTH
 mix[idx,0]+=y*np.sqrt((1-pan)/2);mix[idx,1]+=y*np.sqrt((1+pan)/2)
chords=[(48,52,55),(43,50,55),(45,48,52),(41,48,53), (48,52,55),(45,48,52),(41,45,48),(43,50,55), (48,52,55),(43,47,50),(45,48,52),(41,45,48), (50,53,57),(43,50,55),(48,52,55),(43,50,55)]
melodies=[[72,76,79],[74,79,76],[76,72,69],[72,74,77], [79,81,79],[76,74,72],[77,76,72],[74,71,67], [72,76,79],[79,74,71],[76,79,81],[79,77,76], [77,74,72],[74,71,67],[72,76,74],[71,67,74]]
for bar,chord in enumerate(chords):
 base=bar*4
 for n in chord:note(n,base,4,.045,'pad',-.15)
 note(chord[0]-12,base,2,.13,'bass',0);note(chord[0]-5,base+2,2,.08,'bass',0)
 for i in range(8):note(chord[i%3]+12,base+i*.5,1.4,.068 if i%2==0 else .045,'pluck',-.4)
 for off,n in zip([.0,1.5,2.5],melodies[bar]):note(n,base+off,2,.105,'bell',.28)
# Circular early reflections carry the tail naturally across the loop boundary.
mix+=np.roll(mix[:,::-1],round(.19*RATE),axis=0)*.16+np.roll(mix,round(.37*RATE),axis=0)*.09
peak=np.max(np.abs(mix));mix*=.68/max(peak,.01)
out=Path(__file__).resolve().parents[1]/'public/audio';out.mkdir(exist_ok=True)
with wave.open(str(out/'village-day.wav'),'wb') as f:
 f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes((mix*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-y','-v','error','-i',str(out/'village-day.wav'),'-c:a','libvorbis','-q:a','4',str(out/'village-day.ogg')],check=True)
print(f'{LENGTH/RATE:.3f}s, peak {np.max(np.abs(mix)):.3f}, RMS {np.sqrt(np.mean(mix**2)):.3f}')
