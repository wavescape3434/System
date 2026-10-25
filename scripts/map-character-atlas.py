"""Read the original atlas alpha to map each character's render frame and clip path.
The PNG stays unchanged. Per-sprite metadata prevents neighboring art bleeding into SVG frames.
Requires Pillow, NumPy and SciPy in the art preparation environment, not at app runtime.
"""
from pathlib import Path
import json
from PIL import Image
import numpy as np
from scipy.ndimage import label, find_objects, binary_dilation

atlas=Path('public/art/adventurer-roster.png')
a=np.array(Image.open(atlas))[:,:,3]
labels,_=label(a>100)
sizes=np.bincount(labels.ravel());sizes[0]=0
objects=find_objects(labels)
main=sorted(np.argsort(sizes)[-24:],key=lambda i:(int((objects[i-1][0].start+objects[i-1][0].stop)/2)//256,(objects[i-1][1].start+objects[i-1][1].stop)))

frames=[]
for component in main:
    ys,xs=objects[component-1]
    x0=max(0,xs.start-2);y0=max(0,ys.start-2)
    width=min(a.shape[1],xs.stop+2)-x0;height=min(a.shape[0],ys.stop+2)-y0
    mask=binary_dilation(labels[y0:y0+height,x0:x0+width]==component,structure=np.ones((3,3)))
    active={};rectangles=[]
    for y in range(height+1):
        row=mask[y] if y<height else np.zeros(width,dtype=bool)
        changes=np.diff(np.r_[False,row,False].astype(int))
        runs=set(zip(np.flatnonzero(changes==1),np.flatnonzero(changes==-1)))
        for run in list(active):
            if run not in runs:
                start=active.pop(run);rectangles.append((int(run[0]),start,int(run[1]-run[0]),y-start))
        for run in runs:
            if run not in active:active[run]=y
    clip=' '.join(f'M{x},{y} h{w} v{h} h{-w} Z' for x,y,w,h in rectangles)
    frames.append({'x':x0,'y':y0,'width':width,'height':height,'clip':clip})
Path('src/character-frames.json').write_text(json.dumps({'width':a.shape[1],'height':a.shape[0],'frames':frames},separators=(',',':'))+'\n')
print(f'Mapped {len(frames)} transparent sprite frames; original PNG unchanged.')
