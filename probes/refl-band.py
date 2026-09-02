"""The added mark inside a reflection band, and whether it is BANDED.

A reflection on a still river is a smooth decay away from the waterline; a windy one is
chopped into drifting bars (drawWaterMirror's destination-out pass). filmstrip.mjs's
whole-frame delta is blind under ~2% of the canvas and says nothing about STRUCTURE, so
the claim "the wind breaks it" needs its own number:

  hf = mean |p[y] - (p[y-1]+p[y+1])/2| over the added mark's row profile, as a share of
       the profile's own mean -- a normalised second difference, so it is a shape
       statistic and not a brightness one.

Run it on the SAME instant in both builds (HEAD shot first, candidate second), once on a
calm frame and once on a windy one. Calm should read flat; windy should not.

  python3 probes/refl-band.py shots/head.png shots/cand.png <y0> <y1> <x0> <x1>
"""
import sys, numpy as np
from PIL import Image
head, cand, y0, y1, x0, x1 = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:7])
a = np.asarray(Image.open(head).convert('RGB')).astype(float)[y0:y1, x0:x1]
b = np.asarray(Image.open(cand).convert('RGB')).astype(float)[y0:y1, x0:x1]
d = np.abs(a-b).sum(2)
p = d.mean(1)
hf = np.abs(p[1:-1] - (p[:-2]+p[2:])/2).mean()
print(f'{sys.argv[2]:26s} band rows {y0}-{y1}  mass {d.sum():10.0f}  mean {d.mean():6.2f}'
      f'  px>3 {(d>3).sum():6d}  hf {hf:6.3f}  hf/mean {hf/max(d.mean(),1e-6):6.3f}')
print('   row profile:', ' '.join(f'{v:.0f}' for v in p[:40]))
