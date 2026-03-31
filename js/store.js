const DEFAULT_APPS = [
  { id:'app-wechat',   type:'app', name:'微信',    icon:'W', color:'#07c160', appKey:'wechat' },
  { id:'app-settings', type:'app', name:'设置',    icon:'S', color:'#636366', appKey:'settings' },
  { id:'app-camera',   type:'app', name:'相机',    icon:'C', color:'#1c1c1e', appKey:'camera' },
  { id:'app-gallery',  type:'app', name:'相册',    icon:'G', color:'#ff9500', appKey:'gallery' },
  { id:'app-browser',  type:'app', name:'浏览器',  icon:'B', color:'#0076ff', appKey:'browser' },
  { id:'app-music',    type:'app', name:'音乐',    icon:'M', color:'#ff2d55', appKey:'music' },
  { id:'app-clock',    type:'app', name:'时钟',    icon:'T', color:'#ff9500', appKey:'clock' },
  { id:'app-notes',    type:'app', name:'备忘录',  icon:'N', color:'#ffd60a', appKey:'notes' },
  { id:'app-files',    type:'app', name:'文件',    icon:'F', color:'#0076ff', appKey:'files' },
  { id:'app-store',    type:'app', name:'应用市场',icon:'A', color:'#00c6a2', appKey:'store' },
  { id:'app-phone',    type:'app', name:'电话',    icon:'P', color:'#34c759', appKey:'phone' },
  { id:'app-contacts', type:'app', name:'联系人',  icon:'U', color:'#5856d6', appKey:'contacts' },
  { id:'app-video',    type:'app', name:'视频',    icon:'V', color:'#ff6b35', appKey:'video' },
  { id:'app-map',      type:'app', name:'地图',    icon:'D', color:'#34aadc', appKey:'map' },
  { id:'app-mail',     type:'app', name:'邮件',    icon:'E', color:'#0076ff', appKey:'mail' },
];

const DEFAULT_DOCK = [
  { id:'dock-phone',    type:'app', name:'电话',   icon:'P', color:'#34c759', appKey:'phone' },
  { id:'dock-wechat',   type:'app', name:'微信',   icon:'W', color:'#07c160', appKey:'wechat' },
  { id:'dock-browser',  type:'app', name:'浏览器', icon:'B', color:'#0076ff', appKey:'browser' },
  { id:'dock-camera',   type:'app', name:'相机',   icon:'C', color:'#1c1c1e', appKey:'camera' },
  { id:'dock-settings', type:'app', name:'设置',   icon:'S', color:'#636366', appKey:'settings' },
];

const DEFAULT_SETTINGS = {
  wallpaper:'1', apiProvider:'deepseek',
  apiKey:'', apiBaseUrl:'https://api.openai.com', userName:'我',
};

const DEFAULT_WECHAT_USERS = [
  { id:'user-001', name:'AI 助手', avatarColor:'#00c6a2', systemPrompt:'你是一个友善聪明的 AI 助手，用自然轻松的语气聊天。', messages:[], unread:0 },
  { id:'user-002', name:'林小晴',  avatarColor:'#ff6b9d', systemPrompt:'你扮演叫林小晴的女生，活泼开朗，说话俏皮，不要说自己是AI。', messages:[], unread:0 },
  { id:'user-003', name:'苏哲',    avatarColor:'#5856d6', systemPrompt:'你扮演叫苏哲的男生，沉稳理性，喜欢技术和哲学，不要说自己是AI。', messages:[], unread:0 },
];

const SYSTEM_WIDGETS = [
  // ===== 时间日期（3格宽 1格高横条） =====
  {
    id:'sys-time-clock',
    name:'时间日期',
    w:3, h:1,
    html:`<!DOCTYPE html><html><head><meta charset='UTF-8'/><style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;}
body{
  display:flex;align-items:center;
  padding:0 14%;
  background:transparent;
  font-family:'PingFang SC','Helvetica Neue',Arial,sans-serif;
}
#t{
  font-size:clamp(24px,5vw,40px);
  font-weight:200;color:#fff;
  letter-spacing:-1px;line-height:1;
  text-shadow:0 2px 16px rgba(0,0,0,0.4);
  flex-shrink:0;margin-right:14px;
}
.right{display:flex;flex-direction:column;justify-content:center;gap:2px;}
#d{font-size:clamp(11px,2vw,13px);color:rgba(255,255,255,0.7);letter-spacing:0.3px;}
#w{font-size:clamp(10px,1.8vw,12px);color:rgba(255,255,255,0.45);}
</style></head><body>
<div id='t'></div>
<div class='right'><div id='d'></div><div id='w'></div></div>
<script>
var ws=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
function u(){
  var n=new Date();
  var h=n.getHours().toString().padStart(2,'0');
  var m=n.getMinutes().toString().padStart(2,'0');
  document.getElementById('t').textContent=h+':'+m;
  document.getElementById('d').textContent=(n.getMonth()+1)+'月'+n.getDate()+'日';
  document.getElementById('w').textContent=ws[n.getDay()];
}
u();setInterval(u,1000);
<\/script></body></html>`
  },

  // ===== 数字时钟（2格宽 1格高） =====
  {
    id:'sys-clock-small',
    name:'数字时钟',
    w:2, h:1,
    html:`<!DOCTYPE html><html><head><meta charset='UTF-8'/><style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;}
body{
  display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,0.28);
  backdrop-filter:blur(20px);
  font-family:'Helvetica Neue',sans-serif;
}
#t{
  color:#fff;
  font-size:clamp(16px,3.5vw,26px);
  font-weight:300;
  letter-spacing:1px;
  text-shadow:0 1px 8px rgba(0,0,0,0.4);
}
</style></head><body>
<div id='t'></div>
<script>
function u(){
  var d=new Date();
  document.getElementById('t').textContent=
    d.getHours().toString().padStart(2,'0')+':'+
    d.getMinutes().toString().padStart(2,'0')+':'+
    d.getSeconds().toString().padStart(2,'0');
}
u();setInterval(u,1000);
<\/script></body></html>`
  },

  // ===== 计数日 / 倒数日（2格宽 2格高） =====
  {
    id:'sys-countdown',
    name:'计数日',
    w:2, h:2,
    html:`<!DOCTYPE html><html><head><meta charset='UTF-8'/><style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;}
body{
  font-family:'PingFang SC','Helvetica Neue',Arial,sans-serif;
  background:linear-gradient(135deg,rgba(0,122,255,0.55),rgba(88,86,214,0.55));
  backdrop-filter:blur(20px);
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:4px;padding:10px;
  position:relative;overflow:hidden;
}
#bg{
  position:absolute;inset:0;
  background-size:cover;background-position:center;
  opacity:0.35;
}
.content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;}
#label{font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.5px;text-align:center;}
#days{font-size:clamp(28px,7vw,48px);font-weight:700;color:#fff;line-height:1;text-shadow:0 2px 10px rgba(0,0,0,0.3);}
#unit{font-size:11px;color:rgba(255,255,255,0.7);}
#name{font-size:12px;color:rgba(255,255,255,0.9);font-weight:500;text-align:center;}
.dots{display:flex;gap:5px;margin-top:4px;}
.dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.35);cursor:pointer;transition:background 0.2s;}
.dot.active{background:rgba(255,255,255,0.9);}
</style></head><body>
<div id='bg'></div>
<div class='content'>
  <div id='label'></div>
  <div id='days'>--</div>
  <div id='unit'>天</div>
  <div id='name'></div>
  <div class='dots' id='dots'></div>
</div>
<script>
var STORAGE_KEY='countdown_presets';
var presets=[];
var currentIdx=0;
var rotateTimer=null;
var rotateInterval=5000;
var rotateMode='none'; // 'none'|'rotate'|'click'

function load(){
  try{
    var s=localStorage.getItem(STORAGE_KEY);
    if(s){var d=JSON.parse(s);presets=d.presets||[];currentIdx=d.currentIdx||0;rotateMode=d.rotateMode||'none';rotateInterval=d.rotateInterval||5000;}
  }catch(e){}
}
function save(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({presets,currentIdx,rotateMode,rotateInterval}));}catch(e){}
}
function calcDays(preset){
  var today=new Date();today.setHours(0,0,0,0);
  var target=new Date(preset.date);target.setHours(0,0,0,0);
  var diff=Math.round((target-today)/86400000);
  if(preset.type==='memorial') return {days:Math.abs(Math.round((today-target)/86400000)),label:'已经',unit:'天'};
  return {days:Math.abs(diff),label:diff>0?'还有':'已过',unit:'天'};
}
function render(){
  if(!presets.length){
    document.getElementById('label').textContent='长按设置日期';
    document.getElementById('days').textContent='--';
    document.getElementById('name').textContent='';
    document.getElementById('dots').innerHTML='';
    return;
  }
  var idx=Math.min(currentIdx,presets.length-1);
  var p=presets[idx];
  var r=calcDays(p);
  document.getElementById('label').textContent=r.label;
  document.getElementById('days').textContent=r.days;
  document.getElementById('unit').textContent=r.unit;
  document.getElementById('name').textContent=p.name||'';
  if(p.bg){document.getElementById('bg').style.backgroundImage='url('+p.bg+')';}
  else{document.getElementById('bg').style.backgroundImage='';}
  // 指示点
  var dots=document.getElementById('dots');
  dots.innerHTML='';
  presets.forEach(function(_,i){
    var d=document.createElement('div');
    d.className='dot'+(i===idx?' active':'');
    d.onclick=function(){currentIdx=i;render();save();};
    dots.appendChild(d);
  });
}
function startRotate(){
  if(rotateTimer)clearInterval(rotateTimer);
  if(rotateMode==='rotate'){
    rotateTimer=setInterval(function(){
      currentIdx=(currentIdx+1)%presets.length;
      render();save();
    },rotateInterval);
  }
}
function stopRotate(){if(rotateTimer){clearInterval(rotateTimer);rotateTimer=null;}}

// 点击切换（click模式）
document.body.addEventListener('click',function(){
  if(rotateMode==='click'&&presets.length>1){
    currentIdx=(currentIdx+1)%presets.length;
    render();save();
  }
});

// 接收来自父页面的设置消息
window.addEventListener('message',function(e){
  if(!e.data||e.data.type!=='countdown-config')return;
  presets=e.data.presets||presets;
  currentIdx=e.data.currentIdx||0;
  rotateMode=e.data.rotateMode||'none';
  rotateInterval=e.data.rotateInterval||5000;
  save();
  stopRotate();
  render();
  startRotate();
});

load();render();startRotate();
<\/script></body></html>`
  },

  // ===== 用户卡片（4格宽 3格高） =====
  {
    id:'sys-user-card',
    name:'用户卡片',
    w:4, h:3,
    html:`<!DOCTYPE html><html><head><meta charset='UTF-8'/><style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;}
body{
  font-family:'PingFang SC','Helvetica Neue',Arial,sans-serif;
  position:relative;background:#1a1a2e;
}
#bg{
  position:absolute;inset:0;
  background-size:cover;background-position:center;
  background-color:#1a1a2e;
}
#bg-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.1),rgba(0,0,0,0.55));}
.card{
  position:relative;z-index:1;
  width:100%;height:100%;
  display:flex;flex-direction:column;
  align-items:center;justify-content:flex-end;
  padding-bottom:10px;gap:3px;
}
#avatar{
  width:44px;height:44px;border-radius:50%;
  background:rgba(255,255,255,0.2);
  border:2px solid rgba(255,255,255,0.6);
  object-fit:cover;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  font-size:18px;color:#fff;overflow:hidden;
  flex-shrink:0;
}
#avatar img{width:100%;height:100%;object-fit:cover;}
#username{
  font-size:13px;font-weight:600;color:#fff;
  cursor:pointer;text-shadow:0 1px 4px rgba(0,0,0,0.4);
  text-align:center;
}
#userid{
  font-size:10px;color:rgba(255,255,255,0.55);
  cursor:pointer;text-align:center;
}
.stats{display:flex;gap:14px;margin-top:2px;}
.stat{display:flex;flex-direction:column;align-items:center;cursor:pointer;}
.stat-num{font-size:12px;font-weight:600;color:#fff;}
.stat-label{font-size:9px;color:rgba(255,255,255,0.5);}
/* 编辑弹窗 */
.edit-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,0.6);
  z-index:100;display:none;align-items:center;justify-content:center;
}
.edit-overlay.show{display:flex;}
.edit-box{
  background:#fff;border-radius:16px;padding:16px;width:85%;
  display:flex;flex-direction:column;gap:10px;
}
.edit-title{font-size:14px;font-weight:600;color:#111;text-align:center;}
.edit-input{
  width:100%;padding:8px 10px;border:1px solid #ddd;
  border-radius:8px;font-size:13px;outline:none;font-family:inherit;
}
.edit-btns{display:flex;gap:8px;}
.edit-confirm{flex:1;padding:8px;border-radius:8px;background:#007aff;border:none;color:#fff;font-size:13px;cursor:pointer;font-family:inherit;}
.edit-cancel{flex:1;padding:8px;border-radius:8px;background:#f0f0f0;border:none;color:#555;font-size:13px;cursor:pointer;font-family:inherit;}
</style></head><body>
<div id='bg'></div>
<div id='bg-overlay'></div>
<div class='card'>
  <div id='avatar'><span id='avatar-letter'>U</span></div>
  <div id='username'>用户名</div>
  <div id='userid'>@account</div>
  <div class='stats'>
    <div class='stat' onclick='editField("fans")'><div class='stat-num' id='fans'>0</div><div class='stat-label'>粉丝</div></div>
    <div class='stat' onclick='editField("likes")'><div class='stat-num' id='likes'>0</div><div class='stat-label'>获赞</div></div>
  </div>
  </div>
</div>
<!-- 编辑弹窗 -->
<div class='edit-overlay' id='editOverlay'>
  <div class='edit-box'>
    <div class='edit-title' id='editTitle'>编辑</div>
    <input class='edit-input' id='editInput' placeholder='请输入内容'/>
    <label style='display:flex;align-items:center;gap:8px;font-size:12px;color:#555;cursor:pointer' id='imgLabel'>
      <span>上传图片</span>
      <input type='file' accept='image/*' style='display:none' id='imgFile'/>
    </label>
    <div class='edit-btns'>
      <button class='edit-confirm' onclick='confirmEdit()'>确认</button>
      <button class='edit-cancel' onclick='closeEdit()'>取消</button>
    </div>
  </div>
</div>
<script>
var KEY='user_card_data';
var data={username:'用户名',userid:'account',fans:'0',likes:'0',avatarImg:'',bgImg:''};
var editField_name='';
function load(){try{var s=localStorage.getItem(KEY);if(s)data=Object.assign(data,JSON.parse(s));}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){}}
function render(){
  document.getElementById('username').textContent=data.username;
  document.getElementById('userid').textContent='@'+data.userid;
  document.getElementById('fans').textContent=data.fans;
  document.getElementById('likes').textContent=data.likes;
  document.getElementById('avatar-letter').textContent=data.username.slice(0,1)||'U';
  if(data.avatarImg){
    document.getElementById('avatar').innerHTML='<img src="'+data.avatarImg+'"/>';
  }
  if(data.bgImg){
    document.getElementById('bg').style.backgroundImage='url('+data.bgImg+')';
  }
}
function editField(field){
  editField_name=field;
  var titles={username:'修改用户名',userid:'修改账号',fans:'修改粉丝数',likes:'修改获赞数',avatar:'修改头像',bg:'修改背景'};
  document.getElementById('editTitle').textContent=titles[field]||'编辑';
  document.getElementById('editInput').value=data[field]||'';
  var imgLabel=document.getElementById('imgLabel');
  if(field==='avatar'||field==='bg'){
    imgLabel.style.display='flex';
    document.getElementById('imgFile').onchange=function(e){
      var file=e.target.files[0];if(!file)return;
      var reader=new FileReader();
      reader.onload=function(ev){
        data[field+'Img']=ev.target.result;
        save();render();closeEdit();
      };
      reader.readAsDataURL(file);
    };
  } else {
    imgLabel.style.display='none';
  }
  document.getElementById('editOverlay').classList.add('show');
}
function confirmEdit(){
  var val=document.getElementById('editInput').value.trim();
  if(val&&editField_name){data[editField_name]=val;save();render();}
  closeEdit();
}
function closeEdit(){document.getElementById('editOverlay').classList.remove('show');}
document.getElementById('username').onclick=function(){editField('username');};
document.getElementById('userid').onclick=function(){editField('userid');};
document.getElementById('avatar').onclick=function(){editField('avatar');};
document.getElementById('bg').onclick=function(){editField('bg');};
load();render();
<\/script></body></html>`
  },

  // ===== 黑胶片（2格宽 3格高） =====
  {
    id:'sys-vinyl',
    name:'黑胶片',
    w:2, h:3,
    html:`<!DOCTYPE html><html><head><meta charset='UTF-8'/><style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:#111;}
body{display:flex;align-items:center;justify-content:center;position:relative;}
.vinyl{
  width:82%;aspect-ratio:1;border-radius:50%;
  background:radial-gradient(circle at center,#222 18%,#111 19%,#1a1a1a 28%,#0d0d0d 29%,#1a1a1a 38%,#0d0d0d 39%,#1a1a1a 50%,#0d0d0d 51%,#1a1a1a 62%,#0d0d0d 63%,#1a1a1a 75%,#111 100%);
  box-shadow:0 4px 20px rgba(0,0,0,0.8);
  position:relative;cursor:pointer;
  animation:spin 8s linear infinite paused;
  display:flex;align-items:center;justify-content:center;
}
.vinyl.playing{animation-play-state:running;}
@keyframes spin{to{transform:rotate(360deg);}}
.vinyl-center{
  width:28%;aspect-ratio:1;border-radius:50%;
  background:#222;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;position:relative;z-index:2;
  border:2px solid #333;
}
.vinyl-center img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.vinyl-center-default{color:rgba(255,255,255,0.2);font-size:14px;}
.upload-hint{
  position:absolute;bottom:8px;
  color:rgba(255,255,255,0.3);font-size:10px;
  font-family:'PingFang SC',sans-serif;text-align:center;width:100%;
}
input[type=file]{display:none;}
</style></head><body>
<div class='vinyl' id='vinyl'>
  <div class='vinyl-center' id='center'>
    <span class='vinyl-center-default'>♪</span>
  </div>
</div>
<div class='upload-hint'>点击上传图片</div>
<input type='file' accept='image/*' id='fileInput'/>
<script>
var vinyl=document.getElementById('vinyl');
var center=document.getElementById('center');
var fileInput=document.getElementById('fileInput');
var playing=false;
var KEY='vinyl_img';
try{var saved=localStorage.getItem(KEY);if(saved){center.innerHTML='<img src="'+saved+'"/>';}}catch(e){}
vinyl.onclick=function(){
  playing=!playing;
  vinyl.classList.toggle('playing',playing);
};
vinyl.ondblclick=function(e){e.stopPropagation();fileInput.click();};
fileInput.onchange=function(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    center.innerHTML='<img src="'+ev.target.result+'"/>';
    try{localStorage.setItem(KEY,ev.target.result);}catch(e){}
  };
  reader.readAsDataURL(file);
};
<\/script></body></html>`
  },

  // ===== 拍立得（2格宽 3格高） =====
  {
    id:'sys-polaroid',
    name:'拍立得',
    w:2, h:3,
    html:`<!DOCTYPE html><html><head><meta charset='UTF-8'/><style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:transparent;}
body{display:flex;align-items:center;justify-content:center;}
.polaroid{
  width:82%;
  background:var(--frame-color,#fff);
  border-radius:4px;
  padding:6px 6px 18px 6px;
  box-shadow:0 4px 20px rgba(0,0,0,0.4);
  transform:rotate(var(--rotate,5deg));
  cursor:pointer;position:relative;
  transition:transform 0.3s;
}
.photo{
  width:100%;aspect-ratio:1;
  background:#e0e0e0;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;position:relative;
}
.photo img{width:100%;height:100%;object-fit:cover;}
.photo-hint{font-size:11px;color:#aaa;font-family:'PingFang SC',sans-serif;text-align:center;}
.caption{
  text-align:center;margin-top:4px;
  font-size:10px;color:#555;
  font-family:'PingFang SC',sans-serif;
  min-height:14px;
}
input[type=file]{display:none;}
/* 设置面板 */
.setting-panel{
  position:fixed;inset:0;background:rgba(0,0,0,0.5);
  z-index:100;display:none;align-items:flex-end;justify-content:center;
}
.setting-panel.show{display:flex;}
.setting-box{
  width:100%;background:#fff;border-radius:16px 16px 0 0;
  padding:16px;display:flex;flex-direction:column;gap:10px;
}
.setting-title{font-size:13px;font-weight:600;color:#111;text-align:center;}
.setting-row{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#555;}
.setting-input{width:80px;padding:4px 8px;border:1px solid #ddd;border-radius:6px;font-size:12px;text-align:center;}
.color-list{display:flex;gap:8px;flex-wrap:wrap;}
.color-dot{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;}
.color-dot.active{border-color:#111;}
.close-btn{padding:8px;background:#f0f0f0;border:none;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit;}
</style></head><body>
<div class='polaroid' id='polaroid'>
  <div class='photo' id='photo'>
    <span class='photo-hint'>点击上传</span>
  </div>
  <div class='caption' id='caption'>拍立得</div>
</div>
<input type='file' accept='image/*' id='fileInput'/>
<div class='setting-panel' id='settingPanel'>
  <div class='setting-box'>
    <div class='setting-title'>拍立得设置</div>
    <div class='setting-row'>
      <span>旋转角度</span>
      <input class='setting-input' type='number' id='rotateInput' value='5' min='-30' max='30'/>
    </div>
    <div class='setting-row'>
      <span>边框颜色</span>
      <div class='color-list' id='colorList'></div>
    </div>
    <div class='setting-row'>
      <span>说明文字</span>
      <input class='setting-input' type='text' id='captionInput' placeholder='拍立得'/>
    </div>
    <button class='close-btn' onclick='closeSetting()'>完成</button>
  </div>
</div>
<script>
var KEY='polaroid_data';
var data={img:'',rotate:5,color:'#ffffff',caption:'拍立得'};
var colors=['#ffffff','#fff9c4','#fce4ec','#e8f5e9','#e3f2fd','#111111','#f5f5dc'];
function load(){try{var s=localStorage.getItem(KEY);if(s)data=Object.assign(data,JSON.parse(s));}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){}}
function render(){
  document.getElementById('polaroid').style.setProperty('--rotate',data.rotate+'deg');
  document.getElementById('polaroid').style.setProperty('--frame-color',data.color);
  document.getElementById('caption').textContent=data.caption;
  if(data.img){document.getElementById('photo').innerHTML='<img src="'+data.img+'"/>';}
  document.getElementById('rotateInput').value=data.rotate;
  document.getElementById('captionInput').value=data.caption;
  var list=document.getElementById('colorList');
  list.innerHTML='';
  colors.forEach(function(c){
    var d=document.createElement('div');
    d.className='color-dot'+(c===data.color?' active':'');
    d.style.background=c;
    d.style.border=c==='#ffffff'?'2px solid #ddd':'2px solid transparent';
    if(c===data.color)d.style.borderColor='#111';
    d.onclick=function(){data.color=c;save();render();};
    list.appendChild(d);
  });
}
var longPressTimer=null;
var polaroid=document.getElementById('polaroid');
polaroid.onmousedown=function(){longPressTimer=setTimeout(function(){openSetting();},600);};
polaroid.onmouseup=function(){if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}};
polaroid.onclick=function(){document.getElementById('fileInput').click();};
document.getElementById('fileInput').onchange=function(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){data.img=ev.target.result;save();render();};
  reader.readAsDataURL(file);
};
function openSetting(){document.getElementById('settingPanel').classList.add('show');}
function closeSetting(){
  data.rotate=parseInt(document.getElementById('rotateInput').value)||5;
  data.caption=document.getElementById('captionInput').value||'拍立得';
  save();render();
  document.getElementById('settingPanel').classList.remove('show');
}
load();render();
<\/script></body></html>`
  },

  // ===== 音乐播放器（2格宽 2格高） =====
  {
    id:'sys-music-player',
    name:'音乐播放器',
    w:2, h:2,
    html:`<!DOCTYPE html><html><head><meta charset='UTF-8'/><style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;}
body{
  background:linear-gradient(135deg,#1a1a2e,#16213e);
  font-family:'PingFang SC','Helvetica Neue',Arial,sans-serif;
  display:flex;flex-direction:column;
  padding:10px;gap:6px;
  position:relative;
}
#bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0.2;}
.top{display:flex;align-items:center;gap:8px;position:relative;z-index:1;}
.cover{
  width:38px;height:38px;border-radius:8px;
  background:rgba(255,255,255,0.1);
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;flex-shrink:0;cursor:pointer;
}
.cover img{width:100%;height:100%;object-fit:cover;}
.cover-default{color:rgba(255,255,255,0.3);font-size:16px;}
.info{flex:1;overflow:hidden;}
#title{font-size:12px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;}
#artist{font-size:10px;color:rgba(255,255,255,0.5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;}
.progress-wrap{position:relative;z-index:1;}
.progress-bg{height:3px;background:rgba(255,255,255,0.15);border-radius:3px;cursor:pointer;}
.progress-fill{height:100%;background:linear-gradient(90deg,#00c6a2,#0099cc);border-radius:3px;width:0%;transition:width 0.5s linear;}
.controls{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;}
.ctrl-btn{
  width:28px;height:28px;border-radius:50%;
  background:rgba(255,255,255,0.08);
  border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  color:#fff;font-size:12px;transition:background 0.15s;
}
.ctrl-btn:active{background:rgba(255,255,255,0.18);}
.play-btn{
  width:36px;height:36px;
  background:linear-gradient(135deg,#00c6a2,#0099cc);
  border-radius:50%;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  color:#fff;font-size:14px;
  box-shadow:0 2px 8px rgba(0,198,162,0.4);
}
input[type=file]{display:none;}
</style></head><body>
<div id='bg'></div>
<div class='top'>
  <div class='cover' id='cover' onclick='document.getElementById("coverFile").click()'>
    <span class='cover-default'>♪</span>
  </div>
  <div class='info'>
    <div id='title' onclick='editText("title")'>歌曲名称</div>
    <div id='artist' onclick='editText("artist")'>艺术家</div>
  </div>
</div>
<div class='progress-wrap'>
  <div class='progress-bg' id='progressBg'>
    <div class='progress-fill' id='progressFill'></div>
  </div>
</div>
<div class='controls'>
  <button class='ctrl-btn' onclick='prev()'>&#9664;&#9664;</button>
  <button class='play-btn' id='playBtn' onclick='togglePlay()'>&#9654;</button>
  <button class='ctrl-btn' onclick='next()'>&#9654;&#9654;</button>
</div>
<input type='file' accept='image/*' id='coverFile'/>
<script>
var KEY='music_widget';
var data={title:'歌曲名称',artist:'艺术家',coverImg:'',bgImg:'',progress:0,playing:false};
var progressTimer=null;
function load(){try{var s=localStorage.getItem(KEY);if(s)data=Object.assign(data,JSON.parse(s));}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){}}
function render(){
  document.getElementById('title').textContent=data.title;
  document.getElementById('artist').textContent=data.artist;
  if(data.coverImg){
    document.getElementById('cover').innerHTML='<img src="'+data.coverImg+'"/>';
    document.getElementById('bg').style.backgroundImage='url('+data.coverImg+')';
  }
  document.getElementById('progressFill').style.width=data.progress+'%';
  document.getElementById('playBtn').innerHTML=data.playing?'&#9646;&#9646;':'&#9654;';
}
function togglePlay(){
  data.playing=!data.playing;
  if(data.playing){
    progressTimer=setInterval(function(){
      data.progress=Math.min(100,data.progress+0.5);
      document.getElementById('progressFill').style.width=data.progress+'%';
      if(data.progress>=100){data.progress=0;data.playing=false;clearInterval(progressTimer);render();}
    },300);
  } else {
    clearInterval(progressTimer);
  }
  save();render();
}
function prev(){data.progress=0;document.getElementById('progressFill').style.width='0%';save();}
function next(){data.progress=0;document.getElementById('progressFill').style.width='0%';save();}
function editText(field){
  var val=prompt(field==='title'?'歌曲名称':'艺术家',data[field]);
  if(val&&val.trim()){data[field]=val.trim();save();render();}
}
document.getElementById('coverFile').onchange=function(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    data.coverImg=ev.target.result;
    data.bgImg=ev.target.result;
    save();render();
  };
  reader.readAsDataURL(file);
};
load();render();
<\/script></body></html>`
  },
];

const APP_WIDGETS = {
  wechat:[
    {
      id:'wechat-unread',
      name:'未读消息',
      w:2, h:1,
      html:`<!DOCTYPE html><html><head><meta charset='UTF-8'/><style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:100%;height:100%;overflow:hidden;}body{display:flex;align-items:center;justify-content:center;gap:10px;background:rgba(7,193,96,0.3);backdrop-filter:blur(20px);border-radius:16px;font-family:'PingFang SC',sans-serif;}span{color:#fff;font-size:13px;}b{color:#fff;font-size:24px;font-weight:700;}</style></head><body><span>微信</span><b>0</b><span>条未读</span></body></html>`
    }
  ],
};
