"""Build an editable textured 2D armature and export its evaluated bone poses.
Run with Blender --background --python build_russia.py. No external packages.
"""
import bpy
import json
import math
from array import array
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
OUT = ROOT / 'blender'
FPS = 30
STRIDE = 216

def mix(a, b, t):
    return a + (b-a)*t

def smooth(t):
    t = max(0, min(1, t))
    return t*t*(3-2*t)

def point(a, b, t):
    return (mix(a[0], b[0], t), mix(a[1], b[1], t))

def ik(start, end, upper, lower, bend=1):
    dx, dy = end[0]-start[0], end[1]-start[1]
    d = max(.01, math.hypot(dx, dy))
    if d > upper+lower-.01:
        end = (start[0]+dx/d*(upper+lower-.01), start[1]+dy/d*(upper+lower-.01))
        dx, dy = end[0]-start[0], end[1]-start[1]
        d = math.hypot(dx,dy)
    along = (upper*upper-lower*lower+d*d)/(2*d)
    height = math.sqrt(max(0,upper*upper-along*along))*bend
    joint = (start[0]+dx/d*along+dy/d*height, start[1]+dy/d*along-dx/d*height)
    return joint,end

def foot(phase):
    phase %= 1
    if phase < .5:
        return (54-STRIDE*phase,-30), True
    t = (phase-.5)*2
    return (-54+108*smooth(t),-30-58*math.sin(math.pi*t)), False

def pulse(t, begin, peak, finish):
    if t < begin or t > finish:return 0
    if t < peak:return smooth((t-begin)/(peak-begin))
    return 1-smooth((t-peak)/(finish-peak))

def pose(clip, t):
    bob = math.sin(t*math.tau)*1.7 if clip=='idle' else 0
    hips = (0,-145+bob)
    lean = 0
    ankles = [(-24,-30),(25,-30)]
    hands = [(-33,-166+bob),(40,-161+bob)]
    feet_angles=[0,0]
    tail = 0
    if clip=='run':
        p=t%1
        bob = 5*math.cos(p*math.tau*2)
        hips=(0,-145+bob)
        lean=18
        near,near_ground=foot(p)
        far,far_ground=foot(p+.5)
        ankles=[far,near]
        feet_angles=[0 if far_ground else -.25*math.sin((p+.5)%1*math.tau),0 if near_ground else -.25*math.sin(p*math.tau)]
        swing=math.sin(p*math.tau)
        hands=[(-62-18*swing,-202+bob),(-35+24*swing,-184+bob)]
        tail=-18+7*math.sin(p*math.tau*2+.5)
    elif clip in ['jab','kick','heavy']:
        power=pulse(t, .05, .34 if clip=='jab' else .52, .94)
        wind=pulse(t,0,.18 if clip=='jab' else .30,.50)
        lean=(12 if clip=='jab' else 24)*power-12*wind
        hips=(6*power,-145+3*power)
        hands=[(25,-224),(15-45*wind,-218-4*wind)]
        if clip=='jab':
            hands[1]=point(hands[1],(140,-218),power)
        elif clip=='heavy':
            hands[1]=point(hands[1],(176,-220),power)
            hands[0]=point((0,-212),(-22,-180),power)
            tail=-18*power
        else:
            hands=[(8,-225),(44,-222)]
            ankles[1]=point((25,-30),(143,-139),power)
            ankles[0]=(-25,-30)
            feet_angles[1]=-.13*power
            lean=-17*power
        guard=min(smooth(t/(.14 if clip=='jab' else .20)),1-smooth((t-.82)/.18))
        hands=[point((-33,-166),hands[0],guard),point((40,-161),hands[1],guard)]
    chest=(lean,-240+bob)
    head_top=(lean+3,-333+bob)
    head_bottom=(lean+4,-241+bob)
    joints={
        'torso':(chest,(hips[0],hips[1]+2)),
        'head':(head_top,head_bottom),
        'tail_back':((hips[0]-19,hips[1]-5),(hips[0]-25+tail,hips[1]+92)),
        'tail_front':((hips[0]+10,hips[1]-5),(hips[0]+20+tail*.45,hips[1]+92)),
    }
    for i,side in enumerate(['far','near']):
        shoulder=(lean+(-27 if i==0 else 28),-219+bob)
        bend=(1 if i==1 else -1) if clip=='idle' else 1 if clip=='run' else (-1 if hands[i][0]>=shoulder[0] else 1)
        elbow,hand=ik(shoulder,hands[i],55,52,bend)
        joints[side+'_upper']=(shoulder,elbow)
        joints[side+'_fore']=(elbow,hand)
        hip=(hips[0]+(-13 if i==0 else 14),hips[1])
        knee,ankle=ik(hip,ankles[i],72,64,1)
        joints[side+'_thigh']=(hip,knee)
        joints[side+'_shin']=(knee,ankle)
        a=feet_angles[i]
        joints[side+'_boot']=(ankle,(ankle[0]-math.sin(a)*30,ankle[1]+math.cos(a)*30))
    return joints

# Four by three source atlas. PNG stays intact; these are mesh UV rectangles.
image=bpy.data.images.load(str(ASSETS/'russia-parts.png'),check_existing=True)
width,height=image.size
pixels=array('f',[0])*(width*height*4)
image.pixels.foreach_get(pixels)

def box(cell):
    col,row=cell%4,cell//4
    x0,x1=int(col*width/4),int((col+1)*width/4)
    y0,y1=int(row*height/3),int((row+1)*height/3)
    left,top,right,bottom=x1,y1,-1,-1
    for y in range(y0,y1):
        for x in range(x0,x1):
            if pixels[((height-1-y)*width+x)*4+3]>.14:
                left=min(left,x);right=max(right,x);top=min(top,y);bottom=max(bottom,y)
    if right<0:raise RuntimeError('Empty texture cell '+str(cell))
    return [left,top,right-left+1,bottom-top+1]

boxes=[box(i) for i in range(12)]
def split_boot(cell,lower):
    x,y,w,h=boxes[cell]
    split=int(h*.67)
    return [x,y+split-3,w,h-split+3] if lower else [x,y,w,split+3]

parts=[
    dict(name='tail_back',cell=11,width=62,layer=0),
    dict(name='far_thigh',cell=8,width=43,layer=1),
    dict(name='far_shin',cell=9,width=42,layer=2,uv=split_boot(9,False)),
    dict(name='far_boot',cell=9,width=59,layer=3,uv=split_boot(9,True),pivot=.35),
    dict(name='far_upper',cell=4,width=38,layer=4),
    dict(name='far_fore',cell=5,width=44,layer=5),
    dict(name='near_thigh',cell=6,width=46,layer=6),
    dict(name='near_shin',cell=7,width=44,layer=7,uv=split_boot(7,False)),
    dict(name='near_boot',cell=7,width=63,layer=8,uv=split_boot(7,True),pivot=.35),
    dict(name='tail_front',cell=10,width=57,layer=9),
    dict(name='torso',cell=1,width=109,layer=10),
    dict(name='near_upper',cell=2,width=44,layer=11),
    dict(name='near_fore',cell=3,width=48,layer=12),
    dict(name='head',cell=0,width=110,layer=13),
]
for p in parts:
    p['uv']=p.get('uv',boxes[p['cell']]);p['pivot']=p.get('pivot',.5)
    p['overlap']=0 if p['name']=='head' else 7

bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.fps=FPS
scene.view_settings.view_transform='Standard'

def xyz(p):return Vector((p[0]/100,0,-p[1]/100))
rest=pose('idle',0)
armature=bpy.data.armatures.new('Russia_2D_Rig')
rig=bpy.data.objects.new('Russia_2D_Rig',armature);scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
root=armature.edit_bones.new('root');root.head=(0,0,0);root.tail=(0,0,.4)
parents={'head':'torso','tail_front':'torso','tail_back':'torso','near_fore':'near_upper','far_fore':'far_upper','near_shin':'near_thigh','far_shin':'far_thigh','near_boot':'near_shin','far_boot':'far_shin'}
for p in parts:
    b=armature.edit_bones.new(p['name']);a,z=rest[p['name']];b.head=xyz(a);b.tail=xyz(z)
for p in parts:
    armature.edit_bones[p['name']].parent=armature.edit_bones[parents.get(p['name'],'root')]
    armature.edit_bones[p['name']].inherit_scale='NONE'
bpy.ops.object.mode_set(mode='OBJECT')
rig.show_in_front=True

material=bpy.data.materials.new('Russia_Painted_Alpha');material.use_nodes=True
nodes=material.node_tree.nodes;nodes.clear()
output=nodes.new('ShaderNodeOutputMaterial');tex=nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Linear'
transparent=nodes.new('ShaderNodeBsdfTransparent');emission=nodes.new('ShaderNodeEmission');mix_node=nodes.new('ShaderNodeMixShader')
links=material.node_tree.links
links.new(tex.outputs['Color'],emission.inputs['Color']);links.new(tex.outputs['Alpha'],mix_node.inputs[0]);links.new(transparent.outputs[0],mix_node.inputs[1]);links.new(emission.outputs[0],mix_node.inputs[2]);links.new(mix_node.outputs[0],output.inputs['Surface'])

for p in parts:
    a,b=rest[p['name']];dx,dy=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dy)
    angle=math.atan2(dy,dx)-math.pi/2;co,si=math.cos(angle),math.sin(angle)
    w=p['width'];over=p['overlap'];pivot=p['pivot']
    local=[(-w*pivot,-over),(w*(1-pivot),-over),(w*(1-pivot),length+over),(-w*pivot,length+over)]
    verts=[((a[0]+x*co-y*si)/100,-p['layer']*.003,-(a[1]+x*si+y*co)/100) for x,y in local]
    mesh=bpy.data.meshes.new(p['name']+'_mesh');mesh.from_pydata(verts,[],[(0,1,2,3)]);mesh.update()
    obj=bpy.data.objects.new(p['name'],mesh);scene.collection.objects.link(obj);obj.data.materials.append(material)
    uv=mesh.uv_layers.new(name='PaintedAtlas')
    sx,sy,sw,sh=p['uv'];coords=[(sx/width,1-sy/height),((sx+sw)/width,1-sy/height),((sx+sw)/width,1-(sy+sh)/height),(sx/width,1-(sy+sh)/height)]
    for polygon in mesh.polygons:
        for li in polygon.loop_indices:uv.data[li].uv=coords[mesh.loops[li].vertex_index]
    vg=obj.vertex_groups.new(name=p['name']);vg.add(list(range(4)),1,'REPLACE')
    mod=obj.modifiers.new('Armature','ARMATURE');mod.object=rig
    obj['source_cell']=p['cell'];obj['source_png']='russia-parts.png'

camera_data=bpy.data.cameras.new('Orthographic_2D');camera=bpy.data.objects.new('Orthographic_2D',camera_data);scene.collection.objects.link(camera)
camera.location=(0,-10,1.74);camera.rotation_euler=(Vector((0,0,1.74))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=5.12;scene.camera=camera
image.pack()

clips={'idle':(36,True),'run':(18,True),'jab':(13,False),'kick':(19,False),'heavy':(28,False)}
data={'texture':'russia-parts.png','textureSize':[width,height],'stride':STRIDE,'height':340,'fps':FPS,'parts':parts,'clips':{},'source':'Blender 5.3 evaluated pose bones'}
order=['torso','tail_back','tail_front','far_thigh','far_shin','far_boot','near_thigh','near_shin','near_boot','far_upper','far_fore','near_upper','near_fore','head']
for clip,(count,loop) in clips.items():
    rig.animation_data_clear()
    action=bpy.data.actions.new(clip);rig.animation_data_create();rig.animation_data.action=action
    frames=[]
    for i in range(count+1):
        scene.frame_set(i+1);points=pose(clip,i/count)
        for name in order:
            pb=rig.pose.bones[name];ra,rb=rest[name];a,b=points[name]
            delta=math.atan2(b[1]-a[1],b[0]-a[0])-math.atan2(rb[1]-ra[1],rb[0]-ra[0])
            scale=math.hypot(b[0]-a[0],b[1]-a[1])/math.hypot(rb[0]-ra[0],rb[1]-ra[1])
            pb.rotation_mode='QUATERNION'
            pb.matrix=Matrix.Translation(xyz(a))@Matrix.Rotation(delta,4,'Y')@Matrix.Translation(-xyz(ra))@armature.bones[name].matrix_local@Matrix.Diagonal((1,scale,1,1))
            bpy.context.view_layer.update()
            pb.keyframe_insert(data_path='location',frame=i+1);pb.keyframe_insert(data_path='rotation_quaternion',frame=i+1);pb.keyframe_insert(data_path='scale',frame=i+1)
        bpy.context.view_layer.update()
        frame=[]
        for p in parts:
            pb=rig.pose.bones[p['name']]
            a=pb.matrix.translation;b=pb.matrix@Vector((0,armature.bones[p['name']].length,0))
            frame.append([round(a.x*100,4),round(-a.z*100,4),round(b.x*100,4),round(-b.z*100,4)])
        frames.append(frame)
    action.use_fake_user=True
    action['clip_duration']=count/FPS;action['loop']=loop
    data['clips'][clip]={'duration':count/FPS,'loop':loop,'frames':frames}

with (ASSETS/'russia-rig.json').open('w',encoding='utf-8') as f:json.dump(data,f,separators=(',',':'))
rig.animation_data.action=bpy.data.actions['idle'];scene.frame_start=1;scene.frame_end=36;scene.frame_set(1)
rig['instructions']='Actions: idle, run, jab, kick, heavy. Texture is packed. Camera renders on transparent background.'
rig['parts_json']=json.dumps(parts);rig['stride']=STRIDE
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'russia-2d.blend'))
for clip,frame in [('idle',1),('run',5),('jab',5),('kick',11),('heavy',15)]:
    rig.animation_data.action=bpy.data.actions[clip];scene.frame_set(frame)
    scene.render.filepath=str(OUT/(clip+'-preview.png'));bpy.ops.render.render(write_still=True)
print('RUSSIA_EXPORT_OK',len(parts),sum(len(c['frames']) for c in data['clips'].values()))
