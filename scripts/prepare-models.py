"""Run: blender -b -t 2 --python scripts/prepare-models.py -- /path/to/jobs.json
Jobs: [{name, path, animated}]. Never modifies originals.
"""
import bpy, json, sys, pathlib, struct, io
from PIL import Image
jobs = json.loads(pathlib.Path(sys.argv[sys.argv.index('--') + 1]).read_text())
out = pathlib.Path('public/models/uploaded'); out.mkdir(parents=True, exist_ok=True)
existing = out/'provenance.json'
replaced = {job['name'] for job in jobs}
report = [entry for entry in json.loads(existing.read_text()) if entry['id'] not in replaced] if existing.exists() else []
for job in jobs:
    src=pathlib.Path(job['path']); dest=out/(job['name']+'.glb')
    preserve_geometry = job.get('preserveGeometry',job['name'] in ('school','library','apartment','lake'))
    polished_budgets = {'bench':6500,'tree':4000,'paving':1800,'grass':1500,'water':1500,'lotus-water':2500,'tactile':3500,'tactile-broken':3500}
    texture_size = job.get('textureSize',1024 if preserve_geometry or job['name'] in polished_budgets else 512)
    if not job['animated'] and not preserve_geometry:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(src))
        for obj in bpy.context.scene.objects:
            if obj.type=='MESH':
                triangles=sum(len(p.vertices)-2 for p in obj.data.polygons)
                budget = (500 if job['name'] in ('grass','paving','water','lotus-water') else 10000 if job['name']=='player-idle' else 6000 if job['name'] in ('school','library','apartment','lake','otter-idle','turtle-idle','crane-idle') else 1200 if job['name'] in ('tree','fence') else 2500)
                budget=job.get('triangleBudget',polished_budgets.get(job['name'],budget))
                if triangles>budget:
                    mod=obj.modifiers.new('Web simplification','DECIMATE'); mod.ratio=budget/triangles
        # Resize before export to avoid embedding huge original textures.
        for img in bpy.data.images:
            if img.size[0] and max(img.size)>texture_size:
                factor=texture_size/max(img.size); img.scale(max(1,int(img.size[0]*factor)),max(1,int(img.size[1]*factor)))
                img.pack()
        bpy.ops.export_scene.gltf(filepath=str(dest.resolve()),export_format='GLB',export_apply=True)
        raw=dest.read_bytes()
    else:
        raw=src.read_bytes()
    # Rewrite embedded images only. Animation arrays/skins remain byte-for-byte unchanged.
    n=struct.unpack_from('<I',raw,12)[0]; doc=json.loads(raw[20:20+n]); binary=bytearray(raw[28+n:])
    for image in doc.get('images',[]):
        view=doc['bufferViews'][image['bufferView']]; start=view.get('byteOffset',0)
        im=Image.open(io.BytesIO(binary[start:start+view['byteLength']]))
        im.thumbnail((texture_size,texture_size)); stream=io.BytesIO()
        if im.mode in ('RGBA','LA'):
            im.save(stream,format='PNG',optimize=True); image['mimeType']='image/png'
        else:
            im.convert('RGB').save(stream,format='JPEG',quality=82); image['mimeType']='image/jpeg'
        data=stream.getvalue(); binary.extend(b'\0'*((-len(binary))%4)); view['byteOffset']=len(binary);view['byteLength']=len(data);binary.extend(data)
    # Compact bufferViews to discard old image bytes without touching accessor offsets.
    compact=bytearray()
    for view in doc.get('bufferViews',[]):
        compact.extend(b'\0'*((-len(compact))%4)); start=view.get('byteOffset',0); data=binary[start:start+view['byteLength']];view['byteOffset']=len(compact);compact.extend(data)
    compact.extend(b'\0'*((-len(compact))%4));doc['buffers'][0]['byteLength']=len(compact)
    meta=json.dumps(doc,separators=(',',':')).encode();meta+=b' '*((-len(meta))%4)
    result=struct.pack('<III',0x46546c67,2,28+len(meta)+len(compact))+struct.pack('<II',len(meta),0x4e4f534a)+meta+struct.pack('<II',len(compact),0x004e4942)+compact
    dest.write_bytes(result)
    report.append({'id':job['name'],'sourceFile':src.name,'originalBytes':src.stat().st_size,'webBytes':len(result),'animations':[a.get('name') for a in doc.get('animations',[])],'geometryPreserved':bool(preserve_geometry),'textureSize':texture_size})
    print('PREPARED',job['name'],len(result),flush=True)
(out/'provenance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
