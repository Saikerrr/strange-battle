"""Export the open .blend's evaluated actions, preserving manual pose edits.
blender --background russia-2d.blend --python export_russia.py
"""
import bpy
import json
from pathlib import Path
from mathutils import Vector

def export():
    rig=bpy.data.objects['Russia_2D_Rig']
    scene=bpy.context.scene
    parts=json.loads(rig['parts_json'])
    fps=scene.render.fps/scene.render.fps_base
    data={'texture':'russia-parts.png','textureSize':list(bpy.data.images['russia-parts.png'].size),'stride':rig['stride'],'height':340,'fps':fps,'depthStep':.003,'parts':parts,'clips':{},'source':'Blender 5.3 evaluated pose bones'}
    original=rig.animation_data.action
    for name in ['idle','run','jump','jab','kick','heavy']:
        action=bpy.data.actions[name];rig.animation_data.action=action
        count=round(action['clip_duration']*fps)
        frames=[]
        for frame in range(1,count+2):
            scene.frame_set(frame);bpy.context.view_layer.update()
            pose=[]
            for part in parts:
                bone=rig.pose.bones[part['name']]
                a=bone.matrix.translation;b=bone.matrix@Vector((0,rig.data.bones[part['name']].length,0))
                pose.append([round(a.x*100,4),round(-a.z*100,4),round(b.x*100,4),round(-b.z*100,4),round(part['layer']-a.y/.003,4)])
            frames.append(pose)
        data['clips'][name]={'duration':count/fps,'loop':bool(action['loop']),'frames':frames}
    rig.animation_data.action=original
    target=Path(__file__).resolve().parents[1]/'assets'/'russia-rig.json'
    target.write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
    print('RUSSIA_REEXPORT_OK',sum(len(c['frames']) for c in data['clips'].values()))

if __name__=='__main__':export()
