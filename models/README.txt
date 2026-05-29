DROP YOUR 3D MODEL FILES HERE
=============================

This folder holds .glb / .gltf 3D model files.

EXAMPLE FILE NAMES
------------------
  aurora-vessel.glb
  monolith.glb

ABOUT GLB / GLTF
----------------
.glb is the single-file version (recommended).
.gltf is the multi-file version (works too).

EXPORT FROM BLENDER:
  File → Export → glTF 2.0 (.glb/.gltf)
  Format: glTF Binary (.glb)
  Include: Selected Objects (if you only want the model itself)

SIZE TIP
--------
Keep models under 5 MB. Compress textures, decimate when possible.

DON'T HAVE A 3D MODEL?
----------------------
No problem — the 3D viewer is optional.
In index.html, find the <model-viewer> tag for the project and delete it.

HOW IT'S DISPLAYED
------------------
The site uses Google's <model-viewer> web component (loaded from a CDN
in index.html — no install needed). Visitors can click and drag to orbit
around the model, and it auto-rotates by default.
