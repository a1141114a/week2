/* Computer Graphics Week 06. Based on professor-provided starter.
 * Implemented TODO 1–5: color, PBR D/F/G, ARM, tangent normals, environment reflection.
 */
(() => {
'use strict';
const cv=document.querySelector('#cv'), gl=D.context(cv); if(!gl)return;
const VS=`#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUV;
uniform mat4 uVP,uModel;
out vec3 vP,vN,vLocal; out vec2 vUV;
void main(){vec4 w=uModel*vec4(aPos,1.);vP=w.xyz;vN=mat3(transpose(inverse(uModel)))*aNormal;vLocal=aPos;vUV=aUV;gl_Position=uVP*w;}`;
const FS=`#version 300 es
precision highp float;
const float PI=3.14159265;
in vec3 vP,vN,vLocal; in vec2 vUV; out vec4 outColor;
uniform sampler2D uColor,uNormal,uARM,uEnv;
uniform int uStage,uView;
uniform float uHeat,uImpacts,uSun;
uniform vec3 uSunPos;
uniform mat4 uModel;
uniform vec3 uEye,uLight,uTint;
uniform float uRough,uMetal,uNormalStrength,uPower,uAmbient,uEnvPower;

vec3 srgbToLinear(vec3 c){
 return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));
}
vec3 linearToSrgb(vec3 c){
 return mix(12.92*c,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));
}

// TODO 2: D(GGX), F(Schlick), G(Smith-Schlick)를 계산해
// 직접광 PBR 결과를 반환하세요. 6주차 3-2절을 참고하세요.
vec3 directPBR(vec3 N,vec3 V,vec3 L,vec3 base,float rough,float metal){
 
 // D: GGX microfacet distribution; F: Schlick Fresnel; G: Smith-Schlick visibility.
 float r=clamp(rough,0.045,1.0),m=clamp(metal,0.0,1.0);
 float nl=max(dot(N,L),0.0),nv=max(dot(N,V),0.0);
 if(nl<=0.0||nv<=0.0)return vec3(0.0);
 vec3 H=normalize(V+L);float nh=max(dot(N,H),0.0),vh=max(dot(V,H),0.0);
 float a=r*r,a2=a*a,den=nh*nh*(a2-1.0)+1.0;
 float D=a2/max(PI*den*den,1e-7);
 vec3 F0=mix(vec3(0.04),base,m);
 vec3 F=F0+(1.0-F0)*pow(1.0-vh,5.0);
 float k=(r+1.0)*(r+1.0)/8.0;
 float G=nv/(nv*(1.0-k)+k)*nl/(nl*(1.0-k)+k);
 return ((1.0-F)*(1.0-m)*base/PI+D*F*G/max(4.0*nv*nl,1e-6))*nl*uPower;

}

// MASK 1: solar heating expands a sun-facing oxidation region.
float oxidationRegion(vec3 localN,vec3 worldN){
 vec3 center=uModel[3].xyz;vec3 toSun=normalize(uSunPos-center);
 float facing=dot(worldN,toSun);
 float pattern=0.07*sin(localN.x*17.0+sin(localN.z*13.0))*sin(localN.y*19.0);
 float boundary=mix(1.1,-0.35,uHeat);
 return smoothstep(boundary-0.09,boundary+0.09,facing+pattern)*smoothstep(0.0,0.08,uHeat);
}
// MASK 2: deterministic impact centers; density and radius grow continuously.
float impactRegion(vec3 n){
 float mask=0.0;
 for(int i=0;i<18;i++){
  float fi=float(i);float y=1.0-2.0*(fi+0.5)/18.0;
  float a=fi*2.399963;vec3 center=vec3(sqrt(1.0-y*y)*cos(a),y,sqrt(1.0-y*y)*sin(a));
  float impactWeight=smoothstep(fi/18.0,(fi+1.0)/18.0,uImpacts);
  float radius=mix(0.025,0.21,uImpacts)*impactWeight;
  float d=length(n-center);
  mask=max(mask,(1.0-smoothstep(radius*0.65,radius,d))*impactWeight);
 }
 return mask;
}
void main(){
 if(uSun>0.5){vec3 c=vec3(6.0,2.5,0.65);outColor=vec4(linearToSrgb(c/(1.0+c)),1.0);return;}
 vec3 geometricN=normalize(vN),N=geometricN,V=normalize(uEye-vP);
 vec3 delta=uSunPos-vP;float distance2=dot(delta,delta);vec3 L=normalize(delta);
 vec3 base=srgbToLinear(texture(uColor,vUV).rgb)*vec3(.58,.65,.72);
 vec3 arm=texture(uARM,vUV).rgb;
 float rough=clamp(arm.g*.45,.045,1.0),metal=.95,ao=arm.r;
 vec3 localN=normalize(vLocal);
 float oxidation=oxidationRegion(localN,geometricN),impact=impactRegion(localN);
 if(uView==1||uView==2){float mask=uView==1?oxidation:impact;outColor=vec4(vec3(mask),1.0);return;}
 if(uView!=3){
  base=mix(base,vec3(.25,.055,.012),oxidation);rough=mix(rough,.91,oxidation);metal=mix(metal,0.0,oxidation);
  // Fresh impacts override oxidation and expose less rough metal.
  base=mix(base,vec3(.55,.65,.75),impact);rough=mix(rough,.19,impact);metal=mix(metal,1.0,impact);
 }
 
 if(uNormalStrength>0.0){
  vec3 dp1=dFdx(vP),dp2=dFdy(vP);vec2 du1=dFdx(vUV),du2=dFdy(vUV);
  vec3 T=cross(dp2,N)*du1.x+cross(N,dp1)*du2.x;
  vec3 B=cross(dp2,N)*du1.y+cross(N,dp1)*du2.y;
  float inv=inversesqrt(max(max(dot(T,T),dot(B,B)),1e-8));
  vec3 mapN=texture(uNormal,vUV).xyz*2.0-1.0;mapN.xy*=uNormalStrength;
  N=normalize(mat3(T*inv,B*inv,N)*normalize(mapN));
 }

 vec3 color=directPBR(N,V,L,base,rough,metal)*vec3(1.0,.88,.72)*12.0/(1.0+.16*distance2);
 vec3 F0=mix(vec3(.04),base,metal);
 color+=uAmbient*ao*(base*(1.0-metal)*(1.0-F0)+F0);
 
 vec3 reflected=reflect(-V,N);
 vec2 envUV=vec2(atan(reflected.z,reflected.x)/(2.0*PI)+0.5,asin(clamp(reflected.y,-1.0,1.0))/PI+0.5);
 vec3 envColor=srgbToLinear(textureLod(uEnv,envUV,rough*7.0).rgb);
 color+=uEnvPower*ao*envColor*mix(vec3(0.04),base,metal);

 color=max(color,vec3(0.0));outColor=vec4(linearToSrgb(color/(1.0+color)),1.0);

}`;
const prog=D.program(gl,VS,FS),U=D.uniforms(gl,prog,[
 'uModel','uHeat','uImpacts','uSun','uSunPos','uStage','uView','uVP','uEye','uLight','uTint','uRough','uMetal','uNormalStrength','uPower','uAmbient','uEnvPower',
 'uColor','uNormal','uARM','uEnv'
]);
const mesh=D.upload(gl,D.revolution(D.profiles.sphere(1,64),96));
const assets={wood_planks:['Diffuse','nor_gl','arm'],rusty_metal_04:['Diffuse','nor_gl','arm'],rock_boulder_dry:['Diffuse','nor_gl','arm']};
const textures={},jobs=[];let failed=false;
function load(name){
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([128,128,255,255]));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 jobs.push(new Promise(resolve=>{const img=new Image();img.onload=()=>{
  gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  resolve();
 };img.onerror=()=>{failed=true;resolve();};
 img.src='assets/week06/'+name+(name.endsWith('_arm')?'.png':'.jpg');}));
 return tex;
}
for(const [asset,kinds] of Object.entries(assets))textures[asset]=kinds.map(kind=>load(asset+'_'+kind));
const envTex=load('studio_small_09_tonemapped');
Promise.all(jobs).then(()=>{document.querySelector('#status').textContent=failed?'텍스처 로딩 실패: HTTP 서버와 파일 경로 확인':'텍스처 로딩 완료 · PBR · 법선맵 · 두 마스크 준비 완료';});
document.querySelector('#ui').innerHTML='';
const S=D.UI('#ui',[
 {id:'heat',label:'태양 가열 / 접근',min:0,max:100,step:1,value:50},
 {id:'impacts',label:'운석 충돌 누적',min:0,max:100,step:1,value:50},
 {id:'view',type:'select',label:'계산 결과 보기',value:'0',options:[{value:'0',label:'변화한 PBR 표면'},{value:'3',label:'기본 금속 표면'},{value:'1',label:'산화 마스크'},{value:'2',label:'충돌 마스크'}]},
 {id:'spin',type:'check',label:'행성 자전',value:true},
 {id:'normal',label:'normal 강도',min:0,max:5,step:.1,value:1.5},
 {id:'power',label:'태양빛 세기',min:0,max:8,step:.1,value:4},
 {id:'ambient',label:'상수 ambient',min:0,max:.5,step:.01,value:.08},
 {id:'env',label:'환경 반사 세기',min:0,max:3,step:.1,value:1.5}
]);

const cam=D.orbit(cv,{dist:12.5,pitch:.2,yaw:0});document.querySelector('#reset').onclick=()=>{cam.dist=12.5;cam.yaw=0;cam.pitch=.2;rotation=0;};
const view=D.M4.create(),proj=D.M4.create(),vp=D.M4.create();
document.querySelector('#note').textContent='가열이 증가하면 행성이 태양에 접근하고 향한 면의 산화가 넓어집니다. 충돌은 별도의 밝은 금속 흔적을 만듭니다. 겹치면 새 충돌 흔적이 우선합니다. 실제 화학·충돌 시뮬레이션이 아닌 창작 규칙입니다.';
let visible=true;new IntersectionObserver(e=>visible=e[0].isIntersecting).observe(cv);
let rotation=0;const model=D.M4.create();
D.loop((time,dt)=>{
 if(!visible||document.hidden)return;
 D.fit(cv);gl.viewport(0,0,cv.width,cv.height);D.clearColor(gl);gl.enable(gl.DEPTH_TEST);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const eye=cam.eye([0,0,0]);D.M4.lookAt(view,eye,[0,0,0],[0,1,0]);D.M4.perspective(proj,2*Math.atan(Math.tan(Math.PI/8)*Math.max(1,cv.height/cv.width)),cv.width/cv.height,.1,100);D.M4.multiply(vp,proj,view);
 gl.useProgram(prog);gl.uniform1i(U.uStage,5);gl.uniform1i(U.uView,Number(S.view));gl.uniformMatrix4fv(U.uVP,false,vp);gl.uniform3fv(U.uEye,eye);
 gl.uniform3fv(U.uLight,[.6,.7,1.]);gl.uniform3fv(U.uSunPos,[-3.0,0,0]);gl.uniform1f(U.uHeat,S.heat/100);gl.uniform1f(U.uImpacts,S.impacts/100);gl.uniform3fv(U.uTint,[1,1,1]);
 for(const [key,value] of Object.entries({uNormalStrength:S.normal,uPower:S.power,uAmbient:S.ambient,uEnvPower:S.env}))gl.uniform1f(U[key],value);
 [...textures.rock_boulder_dry,envTex].forEach((tex,i)=>{
  gl.impactWeightTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.uniform1i(U[['uColor','uNormal','uARM','uEnv'][i]],i);
 });
 if(S.spin)rotation+=Math.min(dt,.05)*.25;
 const planetX=3.5-2.5*S.heat/100;
 D.M4.identity(model);D.M4.translate(model,model,[planetX,0,0]);D.M4.rotateY(model,model,rotation);D.M4.scale(model,model,[1.35,1.35,1.35]);
 gl.uniformMatrix4fv(U.uModel,false,model);gl.uniform1f(U.uSun,0);
 gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);gl.bindVertexArray(null);
 D.M4.identity(model);D.M4.translate(model,model,[-3,0,0]);D.M4.scale(model,model,[.85,.85,.85]);
 gl.uniformMatrix4fv(U.uModel,false,model);gl.uniform1f(U.uSun,1);
 gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);gl.bindVertexArray(null);
});
})();
