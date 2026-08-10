import { useState, useEffect, useRef } from "react";

const C = {
  bg:"#060e18",surface:"#0b1825",surfaceUp:"#0f2030",border:"#ffffff0d",borderMid:"#ffffff18",
  gold:"#c9a84c",goldSoft:"#e6c97a",goldDim:"#c9a84c33",sage:"#6b9e78",
  blue:"#6b9ec4",lavender:"#9b8fc8",lavDim:"#9b8fc822",
  text:"#e4dfd6",textMid:"#8ea0b2",textDim:"#3d5060",answered:"#6b9e78",
};

const PASSIONS=[
  {id:"family",label:"Family",icon:"🏠",color:"#c9a84c"},{id:"work",label:"Work",icon:"💼",color:"#6b9ec4"},
  {id:"health",label:"Health",icon:"🌿",color:"#6b9e78"},{id:"sports",label:"Sports",icon:"⚽",color:"#c49a4a"},
  {id:"school",label:"School",icon:"📚",color:"#9b8fc8"},{id:"peace",label:"Peace",icon:"🕊️",color:"#9b8fc8"},
  {id:"finances",label:"Finances",icon:"🌱",color:"#6b9e78"},{id:"creativity",label:"Creativity",icon:"🎨",color:"#c47a7a"},
  {id:"community",label:"Community",icon:"🤝",color:"#6b9ec4"},{id:"faith",label:"Faith",icon:"✝️",color:"#c9a84c"},
];
const passionMap = Object.fromEntries(PASSIONS.map(p=>[p.id,p]));

const WORLD_COUNTRIES=[
  {code:"US",name:"United States",  flag:"🇺🇸",lat:38,  lng:-97, requests:1204,passion:"family",   topPrayer:"Healing for families and unity across communities",lang:"en"},
  {code:"BR",name:"Brazil",         flag:"🇧🇷",lat:-14, lng:-51, requests:892, passion:"family",   topPrayer:"Reconciliação familiar e dificuldades econômicas",lang:"pt",translated:"Family reconciliation and economic hardship"},
  {code:"NG",name:"Nigeria",        flag:"🇳🇬",lat:9,   lng:8,   requests:743, passion:"peace",    topPrayer:"Peace in the north, healing and provision",lang:"en"},
  {code:"KR",name:"South Korea",    flag:"🇰🇷",lat:36,  lng:128, requests:521, passion:"faith",    topPrayer:"통일을 위한 기도와 청년 부흥",lang:"ko",translated:"Unification prayers and youth revival"},
  {code:"IN",name:"India",          flag:"🇮🇳",lat:21,  lng:78,  requests:1087,passion:"community",topPrayer:"Religious harmony and healing from disease",lang:"en"},
  {code:"DE",name:"Germany",        flag:"🇩🇪",lat:51,  lng:10,  requests:298, passion:"community",topPrayer:"Spiritual awakening and welcome for refugees",lang:"en"},
  {code:"ET",name:"Ethiopia",       flag:"🇪🇹",lat:9,   lng:40,  requests:634, passion:"peace",    topPrayer:"Peace, drought relief, strength for the church",lang:"en"},
  {code:"PH",name:"Philippines",    flag:"🇵🇭",lat:13,  lng:122, requests:445, passion:"health",   topPrayer:"Typhoon recovery and protection for families",lang:"en"},
  {code:"MX",name:"Mexico",         flag:"🇲🇽",lat:24,  lng:-102,requests:567, passion:"family",   topPrayer:"Seguridad y provisión para las familias",lang:"es",translated:"Safety and provision for families"},
  {code:"UA",name:"Ukraine",        flag:"🇺🇦",lat:49,  lng:32,  requests:891, passion:"peace",    topPrayer:"Peace, protection, return of displaced families",lang:"en"},
  {code:"ID",name:"Indonesia",      flag:"🇮🇩",lat:-5,  lng:120, requests:712, passion:"faith",    topPrayer:"Pemulihan bencana dan pertumbuhan rohani",lang:"id",translated:"Disaster recovery and spiritual growth"},
  {code:"FR",name:"France",         flag:"🇫🇷",lat:46,  lng:2,   requests:187, passion:"faith",    topPrayer:"Renouveau de l'église et unité des croyants",lang:"fr",translated:"Church renewal and unity of believers"},
  {code:"KE",name:"Kenya",          flag:"🇰🇪",lat:1,   lng:38,  requests:403, passion:"health",   topPrayer:"Drought relief, youth guidance, and healing",lang:"en"},
  {code:"CN",name:"China",          flag:"🇨🇳",lat:35,  lng:105, requests:356, passion:"faith",    topPrayer:"Freedom to worship and protection of believers",lang:"en"},
  {code:"AR",name:"Argentina",      flag:"🇦🇷",lat:-34, lng:-64, requests:334, passion:"finances", topPrayer:"Sanidad económica y restauración familiar",lang:"es",translated:"Economic healing and family restoration"},
  {code:"CA",name:"Canada",         flag:"🇨🇦",lat:57,  lng:-96, requests:456, passion:"community",topPrayer:"Indigenous healing and revival in the church",lang:"en"},
  {code:"AU",name:"Australia",      flag:"🇦🇺",lat:-25, lng:133, requests:312, passion:"community",topPrayer:"Bushfire recovery and unity among believers",lang:"en"},
  {code:"JP",name:"Japan",          flag:"🇯🇵",lat:36,  lng:138, requests:189, passion:"health",   topPrayer:"地震からの回復と霊的開放性",lang:"ja",translated:"Earthquake recovery and spiritual openness"},
  {code:"ZA",name:"South Africa",   flag:"🇿🇦",lat:-29, lng:25,  requests:367, passion:"community",topPrayer:"Reconciliation, safety, and economic justice",lang:"en"},
  {code:"GB",name:"United Kingdom", flag:"🇬🇧",lat:55,  lng:-3,  requests:234, passion:"faith",    topPrayer:"Church revival and care for the vulnerable",lang:"en"},
  {code:"RU",name:"Russia",         flag:"🇷🇺",lat:61,  lng:105, requests:445, passion:"peace",    topPrayer:"An end to war and healing for a divided people",lang:"en"},
  {code:"EG",name:"Egypt",          flag:"🇪🇬",lat:26,  lng:30,  requests:289, passion:"faith",    topPrayer:"Protection of believers and peace in the region",lang:"en"},
  {code:"GH",name:"Ghana",          flag:"🇬🇭",lat:8,   lng:-1,  requests:312, passion:"family",   topPrayer:"Stable leadership and provision for families",lang:"en"},
  {code:"CO",name:"Colombia",       flag:"🇨🇴",lat:4,   lng:-74, requests:298, passion:"peace",    topPrayer:"Peace process and healing from conflict",lang:"en"},
  {code:"PE",name:"Peru",           flag:"🇵🇪",lat:-10, lng:-76, requests:198, passion:"community",topPrayer:"Justice for indigenous communities and clean water",lang:"en"},
];

const ME={id:"me",name:"Grace Miller",handle:"@gracemiller",avatar:"GM",bio:"Seeking God's face daily. 🙏",community:"Hope Community Church",followers:84,following:61,closeFriends:["u1","u3","u5"],passions:["family","faith","creativity","community"]};
const USERS={
  u1:{id:"u1",name:"James Okafor", handle:"@jamesokafor", avatar:"JO",bio:"Father, husband, believer.",    passions:["family","sports","faith"],    closeFriends:["me","u3"]},
  u3:{id:"u3",name:"Yuki Tanaka",  handle:"@yukitanaka",  avatar:"YT",bio:"Finding rest in Him.",          passions:["faith","creativity","school"], closeFriends:["me","u1"]},
  u5:{id:"u5",name:"Rachel Kim",   handle:"@rachelkim",   avatar:"RK",bio:"Clinging to grace every day.",  passions:["school","health","faith"],    closeFriends:["me","u3"]},
  u6:{id:"u6",name:"Daniel Mensah",handle:"@danielmensah",avatar:"DM",bio:"Builder. Dreamer.",            passions:["work","community","faith"],   closeFriends:[]},
};
const getUser = id => id==="me" ? ME : USERS[id] || {name:"Unknown",avatar:"?",handle:"@?"};
const GROUPS=[
  {id:"g1",name:"Thursday Bible Study",icon:"📖",color:C.gold,    members:["me","u1","u3","u5","u6"]},
  {id:"g2",name:"Basketball Team",     icon:"⚽",color:C.blue,    members:["me","u1","u6"]},
  {id:"g3",name:"Campus Worship Team", icon:"🎵",color:C.lavender,members:["me","u3","u5"]},
];

const seed = () => [
  {id:1, authorId:"u1",type:"moment", passion:"sports",   audience:"all",   groupId:null, text:"Our team made the playoffs! God is so faithful. 🙏", momentLabel:"Win", prayerCount:61, responses:[{id:"r1",authorId:"u3",text:"I remember you asking for this in September! Amazing.",time:"2h ago",private:false}], time:"3h ago", answered:false},
  {id:2, authorId:"u3",type:"request",passion:"faith",    audience:"close", groupId:null, text:"Leading worship Sunday and feeling inadequate. Pray I'd disappear and only Jesus is seen.", prayerCount:14, responses:[], time:"5h ago", answered:false},
  {id:3, authorId:"u5",type:"moment", passion:"school",   audience:"all",   groupId:null, text:"Thesis defense booked for next month. Two years of prayer brought me here.", momentLabel:"Milestone", prayerCount:38, responses:[], time:"6h ago", answered:false},
  {id:4, authorId:"u1",type:"request",passion:"family",   audience:"close", groupId:null, text:"My marriage has been under strain. Asking my closest people to stand in the gap.", prayerCount:9, responses:[], time:"8h ago", answered:false},
  {id:5, authorId:"me",type:"moment", passion:"work",     audience:"all",   groupId:null, text:"I got the job I prayed about for six months. Still in shock. God's timing is something else.", momentLabel:"Answered 🙏", prayerCount:87, responses:[{id:"r5",authorId:"u1",text:"I was there when you first shared that dream. Crying happy tears!!",time:"10h ago",private:false}], time:"12h ago", answered:true, answeredText:"God opened this door six months after I first asked — the timing was not what I planned, it was better."},
  {id:6, authorId:"u6",type:"request",passion:"family",   audience:"all",   groupId:null, text:"Praying for my parents' marriage. God restore what only He can.", prayerCount:29, responses:[], time:"1d ago", answered:false},
  {id:7, authorId:"u3",type:"request",passion:"community",audience:"group", groupId:"g3", text:"Pray about our worship set direction this season. Want to feel led, not just scheduled.", prayerCount:7, responses:[], time:"1d ago", answered:false},
  {id:8, authorId:"me",type:"request",passion:"faith",    audience:"all",   groupId:null, text:"Stepping into new leadership at church. I feel completely inadequate.", prayerCount:44, responses:[], time:"3d ago", answered:false},
];

const REL_THREADS={
  u1:{sharedSince:"March 2023",nudge:"James has a big game tomorrow — pray for him?",history:[{date:"Sept 2023",text:"Praying for the basketball season",answered:true},{date:"Nov 2023",text:"Standing with him in his marriage",answered:false},{date:"Jan 2024",text:"His mother's surgery",answered:true},{date:"Apr 2024",text:"A career crossroads",answered:true}]},
  u3:{sharedSince:"January 2023",nudge:"Yuki leads worship Sunday — spend a moment with God for her?",history:[{date:"Feb 2023",text:"Wisdom for a major life decision",answered:true},{date:"Jun 2023",text:"Leading worship for the first time",answered:true},{date:"Oct 2023",text:"Feeling burned out from ministry",answered:false},{date:"Mar 2024",text:"Discerning a new direction",answered:false}]},
  u5:{sharedSince:"August 2023",nudge:null,history:[{date:"Sep 2023",text:"Transition anxiety starting grad school",answered:true},{date:"Dec 2023",text:"Struggling with loneliness",answered:false},{date:"Feb 2024",text:"Thesis milestone prayer",answered:true},{date:"May 2024",text:"Health and rest through finals",answered:false}]},
};
const DAILY_NUDGES=[
  {id:"n1",type:"relationship",userId:"u1",text:"James has a big game tomorrow.",cta:"Pray for him",icon:"⚽"},
  {id:"n3",type:"scripture",text:"\"Trust in the Lord with all your heart.\" — Proverbs 3:5",cta:"Sit with this",icon:"📖"},
  {id:"n4",type:"checkin",userId:"u5",text:"Rachel shared something vulnerable 2 days ago.",cta:"Check in on her",icon:"💛"},
];

const fmtNum = n => n>=1000 ? (n/1000).toFixed(1)+"k" : n;
const AVATAR_COLORS={me:C.gold,u1:C.sage,u3:C.blue,u5:C.gold,u6:C.lavender};

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Avi({user,size=40,ring}){
  const c=AVATAR_COLORS[user?.id]||C.gold;
  return <div style={{width:size,height:size,borderRadius:"50%",background:`${c}20`,border:`${ring?2:1.5}px solid ${ring?c:c+"50"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:c,flexShrink:0,fontFamily:"Inter,sans-serif",boxShadow:ring?`0 0 0 3px ${C.bg}, 0 0 0 5px ${c}44`:"none"}}>{user?.avatar||"?"}</div>;
}
function Tag({passion,small}){
  const p=passionMap[passion]; if(!p) return null;
  return <span style={{fontSize:small?10:11,color:p.color,background:`${p.color}18`,padding:small?"1px 7px":"2px 9px",borderRadius:10,fontFamily:"Inter,sans-serif",display:"inline-flex",alignItems:"center",gap:3}}>{p.icon} {p.label}</span>;
}
function Pill({children,active,color=C.sage,onClick,sm}){
  return <button onClick={onClick} style={{background:active?`${color}20`:"transparent",border:`1px solid ${active?color:C.border}`,borderRadius:20,padding:sm?"4px 11px":"7px 15px",color:active?color:C.textDim,cursor:"pointer",fontSize:sm?11:13,fontFamily:"Inter,sans-serif",display:"flex",alignItems:"center",gap:5,flexShrink:0,fontWeight:active?600:400}}>{children}</button>;
}
function Sheet({onClose,children,title,maxH="88vh"}){
  return(
    <div style={{position:"fixed",inset:0,background:"#000000bb",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:C.surface,border:`1px solid ${C.borderMid}`,borderTopLeftRadius:24,borderTopRightRadius:24,width:"100%",maxWidth:500,maxHeight:maxH,display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px 12px"}}>
          <span style={{color:C.text,fontFamily:"Cormorant Garamond,serif",fontSize:20,fontWeight:700}}>{title}</span>
          <button onClick={onClose} style={{background:C.surfaceUp,border:"none",borderRadius:"50%",width:30,height:30,color:C.textMid,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"0 22px 24px"}}>{children}</div>
      </div>
    </div>
  );
}

// ─── GLOBE ────────────────────────────────────────────────────────────────────
// All textures served from raw.githubusercontent.com — confirmed accessible
const TEX = {
  map:    "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg",
  bump:   "https://raw.githubusercontent.com/turban/webgl-earth/master/images/elev_bump_4k.jpg",
  spec:   "https://raw.githubusercontent.com/turban/webgl-earth/master/images/water_4k.png",
  clouds: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/fair_clouds_4k.png",
};

function Globe({onSelect, selectedCode}){
  const mountRef    = useRef(null);
  const stateRef    = useRef({markers:[]});
  const selectedRef = useRef(selectedCode); // read inside animation loop — never triggers re-render
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);

  // Sync selectedRef whenever prop changes — no Three.js mutations here
  useEffect(()=>{ selectedRef.current = selectedCode; }, [selectedCode]);

  useEffect(()=>{
    const THREE = window.THREE;
    if(!THREE || !mountRef.current) return;

    const el   = mountRef.current;
    const W    = el.clientWidth;
    const H    = el.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = "grab";

    // Scene / camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 1000);
    camera.position.z = 2.7;

    // Lights — warm sun + cool rim
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.4);
    sun.position.set(6, 3, 5);
    scene.add(sun);
    scene.add(Object.assign(new THREE.DirectionalLight(0x3355aa, 0.45), {position: new THREE.Vector3(-5,-2,-4)}));

    // Starfield
    const starPos = new Float32Array(2400);
    for(let i=0;i<2400;i++) starPos[i]=(Math.random()-0.5)*300;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos,3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color:0xffffff,size:0.2,transparent:true,opacity:0.55})));

    // Atmosphere haze
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.03,32,32),
      new THREE.MeshPhongMaterial({color:0x4499cc,transparent:true,opacity:0.055,side:THREE.FrontSide,depthWrite:false})
    ));

    // ── Load textures with progress tracking ──
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    let loaded = 0;
    const total = 4;
    const onLoad = () => {
      loaded++;
      setPct(Math.round((loaded/total)*100));
      if(loaded >= 1) setReady(true); // show globe as soon as earth map is ready
    };

    const texMap    = loader.load(TEX.map,    onLoad, undefined, onLoad);
    const texBump   = loader.load(TEX.bump,   onLoad, undefined, onLoad);
    const texSpec   = loader.load(TEX.spec,   onLoad, undefined, onLoad);
    const texClouds = loader.load(TEX.clouds, onLoad, undefined, onLoad);

    // ── Earth sphere ──
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map:         texMap,
      bumpMap:     texBump,
      bumpScale:   0.06,
      specularMap: texSpec,
      specular:    new THREE.Color(0x336688),
      shininess:   20,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // ── Cloud layer ──
    const cloudMat = new THREE.MeshPhongMaterial({
      map:          texClouds,
      transparent:  true,
      opacity:      0.38,
      depthWrite:   false,
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.006,48,48), cloudMat);
    scene.add(clouds);

    // Fallback: mark ready after 6s regardless (onLoad handles the happy path via setPct)
    const readyTimer = setTimeout(()=>setReady(true), 6000);

    // ── lat/lng → 3D ──
    function ll3(lat,lng,r=1.055){
      const phi   = (90-lat)*(Math.PI/180);
      const theta = (lng+180)*(Math.PI/180);
      return new THREE.Vector3(
        -r*Math.sin(phi)*Math.cos(theta),
         r*Math.cos(phi),
         r*Math.sin(phi)*Math.sin(theta)
      );
    }

    // ── Country markers ──
    const markerGrp = new THREE.Group();
    scene.add(markerGrp);
    const markers = [];

    WORLD_COUNTRIES.forEach(c=>{
      const pos = ll3(c.lat, c.lng);
      const s   = 0.013 + (c.requests/1204)*0.02;

      const rMat = new THREE.MeshBasicMaterial({color:0xffcc44,transparent:true,opacity:0.14});
      const ring = new THREE.Mesh(new THREE.SphereGeometry(s*2.5,10,10), rMat);
      ring.position.copy(pos);
      markerGrp.add(ring);

      const dMat = new THREE.MeshBasicMaterial({color:0xffcc44});
      const dot  = new THREE.Mesh(new THREE.SphereGeometry(s,12,12), dMat);
      dot.position.copy(pos);
      dot.userData = {country:c, ring, rMat, dMat};
      markerGrp.add(dot);
      markers.push(dot);
    });
    stateRef.current.markers = markers;

    // ── Drag rotation ──
    let drag=false, prev={x:0,y:0}, vel={x:0,y:0};
    let rotT={x:0.28,y:0.5}, rotC={x:0.28,y:0.5}, autoRot=true, idleT=null;

    const resetIdle = ()=>{ autoRot=false; clearTimeout(idleT); idleT=setTimeout(()=>autoRot=true,3000); };
    const getXY = e => e.touches?.length ? {x:e.touches[0].clientX,y:e.touches[0].clientY} : {x:e.clientX,y:e.clientY};

    const onDown = e=>{ drag=true; prev=getXY(e); vel={x:0,y:0}; resetIdle(); renderer.domElement.style.cursor="grabbing"; };
    const onMove = e=>{
      if(!drag) return;
      const p=getXY(e), dx=p.x-prev.x, dy=p.y-prev.y;
      vel={x:dy*0.005,y:dx*0.005};
      rotT.y+=dx*0.005; rotT.x+=dy*0.005;
      rotT.x=Math.max(-1.3,Math.min(1.3,rotT.x));
      prev=p;
    };
    const onUp = ()=>{ drag=false; renderer.domElement.style.cursor="grab"; };

    // ── Click / tap → select country ──
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    const onClick   = e=>{
      if(Math.abs(vel.x)>0.015||Math.abs(vel.y)>0.015) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const p    = e.changedTouches ? {x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY} : {x:e.clientX,y:e.clientY};
      mouse.x    = ((p.x-rect.left)/rect.width)*2-1;
      mouse.y    = -((p.y-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(markers);
      if(hits.length>0 && hits[0].object.userData?.country) onSelect(hits[0].object.userData.country);
    };

    const cvs = renderer.domElement;
    cvs.addEventListener("mousedown",  onDown);
    cvs.addEventListener("touchstart", onDown,  {passive:true});
    cvs.addEventListener("click",      onClick);
    cvs.addEventListener("touchend",   e=>{ onUp(); onClick(e); });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onMove, {passive:true});

    // ── Animation loop ──
    let raf;
    let cloudAngle = 0;
    const animate = ()=>{
      raf = requestAnimationFrame(animate);
      if(autoRot && !drag) rotT.y += 0.0022;
      vel.x*=0.88; vel.y*=0.88;
      rotC.x += (rotT.x-rotC.x)*0.065;
      rotC.y += (rotT.y-rotC.y)*0.065;

      earth.rotation.x = rotC.x;
      earth.rotation.y = rotC.y;

      // Clouds drift slightly faster than earth
      cloudAngle += 0.00008;
      clouds.rotation.x = rotC.x;
      clouds.rotation.y = rotC.y + cloudAngle;

      markerGrp.rotation.x = rotC.x;
      markerGrp.rotation.y = rotC.y;

      // Pulse markers + highlight selected — all mutations inside rAF are safe from strict mode
      const t = Date.now()*0.002;
      const selCode = selectedRef.current;
      markers.forEach((m,i)=>{
        const isSel = m.userData.country.code === selCode;
        // Pulse ring scale
        const pulse = isSel
          ? 1.8 + Math.sin(t + i*0.85)*0.15   // selected: larger, steadier
          : 1   + Math.sin(t + i*0.85)*0.32;   // default: normal pulse
        m.userData.ring.scale.setScalar(pulse);
        m.userData.rMat.opacity = isSel
          ? 0.28 + Math.sin(t+i*0.85)*0.06
          : 0.10 + Math.sin(t+i*0.85)*0.08;
        // Dot colour — set via r/g/b to avoid readonly Color issues
        if(isSel){
          m.userData.dMat.color.r = 1;
          m.userData.dMat.color.g = 1;
          m.userData.dMat.color.b = 1;
        } else {
          m.userData.dMat.color.r = 1;
          m.userData.dMat.color.g = 0.8;
          m.userData.dMat.color.b = 0.27;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return ()=>{
      cancelAnimationFrame(raf);
      clearTimeout(idleT);
      clearTimeout(readyTimer);
      cvs.removeEventListener("mousedown",  onDown);
      cvs.removeEventListener("touchstart", onDown);
      cvs.removeEventListener("click",      onClick);
      cvs.removeEventListener("touchend",   onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onMove);
      renderer.dispose();
      if(el.contains(cvs)) el.removeChild(cvs);
    };
  }, []);

  // selectedCode changes are handled inside the animation loop via selectedRef — no direct mutations here

  return(
    <div ref={mountRef} style={{width:"100%",height:"100%",position:"relative"}}>
      {!ready && (
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",gap:14}}>
          {/* Progress ring */}
          <svg width="72" height="72" style={{transform:"rotate(-90deg)"}}>
            <circle cx="36" cy="36" r="30" fill="none" stroke="#ffffff0d" strokeWidth="4"/>
            <circle cx="36" cy="36" r="30" fill="none" stroke={C.gold} strokeWidth="4"
              strokeDasharray={`${2*Math.PI*30}`}
              strokeDashoffset={`${2*Math.PI*30*(1-pct/100)}`}
              style={{transition:"stroke-dashoffset 0.4s"}}
              strokeLinecap="round"/>
            <text x="36" y="36" textAnchor="middle" dominantBaseline="middle"
              style={{transform:"rotate(90deg)",transformOrigin:"36px 36px",fill:C.goldSoft,fontSize:"13px",fontFamily:"Inter,sans-serif",fontWeight:600}}>
              {pct}%
            </text>
          </svg>
          <span style={{color:C.textMid,fontSize:13,fontFamily:"Inter,sans-serif"}}>Loading Earth…</span>
        </div>
      )}
    </div>
  );
}

// ─── WORLD TAB ────────────────────────────────────────────────────────────────
function WorldTab(){
  const [sel,setSel]         = useState(null);
  const [search,setSearch]   = useState("");
  const [listMode,setList]   = useState(false);
  const [aiPrayer,setAi]     = useState("");
  const [aiLoad,setAiLoad]   = useState(false);
  const [prayText,setPray]   = useState("");
  const [sent,setSent]       = useState(false);

  function pick(c){ setSel(c); setSent(false); setPray(""); setAi(""); }

  async function getAI(c){
    setAiLoad(true); setAi("");
    const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:200,messages:[{role:"user",content:`Write a sincere intercessory prayer for ${c.name} about: "${c.topPrayer}". 2-3 sentences, include a scripture reference if natural.`}]})});
    const d = await r.json();
    setAi(d.content?.find(b=>b.type==="text")?.text||"");
    setAiLoad(false);
  }

  const filtered = WORLD_COUNTRIES.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"12px 16px 8px",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 style={{color:C.text,fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:700,margin:"0 0 2px"}}>World Intercession</h2>
            <p style={{color:C.textMid,fontSize:12,fontFamily:"Inter,sans-serif",margin:0}}>Drag to spin · tap a glow to pray for a nation</p>
          </div>
          <button onClick={()=>setList(!listMode)} style={{background:listMode?`${C.gold}20`:"transparent",border:`1px solid ${listMode?C.gold:C.border}`,borderRadius:20,padding:"5px 12px",color:listMode?C.gold:C.textDim,cursor:"pointer",fontSize:12,fontFamily:"Inter,sans-serif"}}>
            {listMode?"🌍 Globe":"☰ List"}
          </button>
        </div>
        {listMode && <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search a country…" style={{width:"100%",background:C.surfaceUp,border:`1px solid ${C.border}`,borderRadius:10,padding:"7px 13px",color:C.text,fontSize:13,fontFamily:"Inter,sans-serif",outline:"none",boxSizing:"border-box",marginTop:8}}/>}
      </div>

      {/* Globe / list */}
      {!listMode ? (
        <div style={{flex:1,minHeight:0,position:"relative",background:"radial-gradient(ellipse at 42% 44%, #0c1e38 0%, #030810 100%)"}}>
          <Globe onSelect={pick} selectedCode={sel?.code}/>
          {!sel && (
            <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",background:"rgba(6,14,24,0.88)",backdropFilter:"blur(10px)",border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 18px",pointerEvents:"none",whiteSpace:"nowrap"}}>
              <span style={{color:C.textMid,fontSize:12,fontFamily:"Inter,sans-serif"}}>Drag to rotate · tap a glow to intercede</span>
            </div>
          )}
          {sel && (
            <div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",background:"rgba(11,24,37,0.94)",backdropFilter:"blur(12px)",border:`1px solid ${C.goldDim}`,borderRadius:20,padding:"6px 16px",display:"flex",alignItems:"center",gap:9,whiteSpace:"nowrap",boxShadow:`0 2px 28px ${C.goldDim}`}}>
              <span style={{fontSize:17}}>{sel.flag}</span>
              <span style={{color:C.goldSoft,fontSize:13,fontFamily:"Inter,sans-serif",fontWeight:600}}>{sel.name}</span>
              <span style={{color:C.textDim,fontSize:11,fontFamily:"Inter,sans-serif"}}>🙏 {sel.requests.toLocaleString()}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{flex:1,overflowY:"auto",padding:"0 16px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,paddingBottom:16}}>
            {filtered.map(c=>(
              <button key={c.code} onClick={()=>pick(c)} style={{background:sel?.code===c.code?`${C.gold}18`:C.surfaceUp,border:`1px solid ${sel?.code===c.code?C.gold:C.border}`,borderRadius:14,padding:"12px 10px",cursor:"pointer",textAlign:"left"}}>
                <div style={{fontSize:20,marginBottom:4}}>{c.flag}</div>
                <div style={{color:C.text,fontSize:13,fontWeight:600,fontFamily:"Inter,sans-serif",marginBottom:2}}>{c.name}</div>
                <div style={{color:C.gold,fontSize:11,fontFamily:"Inter,sans-serif"}}>🙏 {c.requests.toLocaleString()}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Country detail sheet */}
      {sel && (
        <div style={{position:"fixed",inset:0,background:"#000000aa",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setSel(null)}>
          <div style={{background:C.surface,border:`1px solid ${C.borderMid}`,borderTopLeftRadius:24,borderTopRightRadius:24,width:"100%",maxWidth:500,maxHeight:"70vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:11,alignItems:"center"}}>
                  <span style={{fontSize:34}}>{sel.flag}</span>
                  <div>
                    <h3 style={{color:C.text,fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:700,margin:"0 0 2px"}}>{sel.name}</h3>
                    <div style={{color:C.gold,fontSize:12,fontFamily:"Inter,sans-serif"}}>🙏 {sel.requests.toLocaleString()} prayer requests</div>
                  </div>
                </div>
                <button onClick={()=>setSel(null)} style={{background:C.surfaceUp,border:"none",borderRadius:"50%",width:28,height:28,color:C.textMid,cursor:"pointer",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            </div>
            <div style={{overflowY:"auto",flex:1,padding:"14px 20px 24px"}}>
              <div style={{background:C.surfaceUp,borderRadius:12,padding:13,marginBottom:13}}>
                <div style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",marginBottom:4,letterSpacing:0.8}}>WHAT THEY'RE PRAYING FOR</div>
                <p style={{color:C.text,fontFamily:"Cormorant Garamond,serif",fontSize:16,fontStyle:"italic",margin:"0 0 6px",lineHeight:1.6}}>"{sel.topPrayer}"</p>
                {sel.translated && <div style={{color:C.textDim,fontSize:11,fontFamily:"Inter,sans-serif",marginBottom:6}}>🌐 Translated from {sel.lang.toUpperCase()}: "{sel.translated}"</div>}
                <Tag passion={sel.passion}/>
              </div>
              {aiPrayer && (
                <div style={{background:`${C.gold}0d`,border:`1px solid ${C.goldDim}`,borderRadius:12,padding:12,marginBottom:12}}>
                  <div style={{color:C.gold,fontSize:10,fontFamily:"Inter,sans-serif",marginBottom:4}}>✨ SUGGESTED INTERCESSORY PRAYER</div>
                  <p style={{color:"#ddc",fontSize:13,fontFamily:"Inter,sans-serif",margin:0,lineHeight:1.65}}>{aiPrayer}</p>
                  <button onClick={()=>setPray(aiPrayer)} style={{marginTop:7,background:C.goldDim,border:`1px solid ${C.gold}44`,borderRadius:8,padding:"3px 11px",color:C.gold,cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif"}}>Use this</button>
                </div>
              )}
              {sent ? (
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{fontSize:36,marginBottom:8}}>🙏</div>
                  <p style={{color:C.gold,fontFamily:"Cormorant Garamond,serif",fontSize:18,margin:"0 0 4px"}}>Your prayer has been sent</p>
                  <p style={{color:C.textMid,fontSize:13,fontFamily:"Inter,sans-serif",margin:0}}>Standing with the people of {sel.name}</p>
                </div>
              ) : (
                <>
                  <textarea value={prayText} onChange={e=>setPray(e.target.value)} placeholder={`Pray for the people of ${sel.name}…`} style={{width:"100%",minHeight:80,background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:12,padding:12,color:C.text,fontSize:14,fontFamily:"Inter,sans-serif",resize:"none",outline:"none",boxSizing:"border-box",lineHeight:1.65,marginBottom:10}}/>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>getAI(sel)} disabled={aiLoad} style={{background:"transparent",border:`1px solid ${C.goldDim}`,borderRadius:20,padding:"8px 14px",color:C.gold,cursor:"pointer",fontSize:13,fontFamily:"Inter,sans-serif"}}>{aiLoad?"…":"✨ AI Help"}</button>
                    <button onClick={()=>{if(prayText.trim())setSent(true);}} style={{flex:1,background:`linear-gradient(135deg,${C.gold},#9a7020)`,border:"none",borderRadius:12,padding:"10px",color:C.bg,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"Inter,sans-serif"}}>🙏 Send Prayer</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({post,prayedSet,onPray,onRespond,onViewProfile,onMarkAnswered}){
  const [exp,setExp]=useState(false);
  const author=getUser(post.authorId); const prayed=prayedSet.has(post.id);
  const group=GROUPS.find(g=>g.id===post.groupId);
  const border=post.answered?C.answered:post.audience==="close"?C.gold:post.audience==="group"?(group?.color||C.blue):"transparent";
  return(
    <div style={{background:`linear-gradient(155deg,${C.surfaceUp},${C.surface})`,border:`1px solid ${C.border}`,borderLeft:`3px solid ${border}`,borderRadius:16,padding:"14px 14px 11px",marginBottom:10}}>
      {post.answered&&<div style={{background:`${C.answered}18`,border:`1px solid ${C.answered}44`,borderRadius:8,padding:"5px 10px",marginBottom:9,display:"flex",alignItems:"center",gap:6}}><span>✅</span><span style={{color:C.answered,fontSize:12,fontFamily:"Inter,sans-serif",fontWeight:600}}>Answered Prayer</span></div>}
      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:9}}>
        <button onClick={()=>onViewProfile(author.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><Avi user={author} size={37}/></button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <button onClick={()=>onViewProfile(author.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><span style={{color:C.text,fontWeight:600,fontSize:13.5,fontFamily:"Inter,sans-serif"}}>{author.name}</span></button>
            <span style={{color:C.textDim,fontSize:11,fontFamily:"Inter,sans-serif"}}>{post.time}</span>
          </div>
          <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
            {post.passion&&<Tag passion={post.passion} small/>}
            {post.momentLabel&&<span style={{fontSize:10,color:post.answered?C.answered:C.gold,background:post.answered?`${C.answered}18`:C.goldDim,padding:"1px 8px",borderRadius:10,fontFamily:"Inter,sans-serif"}}>{post.momentLabel}</span>}
            {post.audience==="close"&&<span style={{fontSize:10,color:C.gold,background:C.goldDim,padding:"1px 8px",borderRadius:10,fontFamily:"Inter,sans-serif"}}>💛 Close</span>}
            {post.audience==="group"&&group&&<span style={{fontSize:10,color:group.color,background:`${group.color}18`,padding:"1px 8px",borderRadius:10,fontFamily:"Inter,sans-serif"}}>{group.icon} {group.name}</span>}
          </div>
        </div>
      </div>
      <p style={{color:C.text,fontSize:14.5,fontFamily:"Inter,sans-serif",lineHeight:1.7,margin:"0 0 10px"}}>{post.text}</p>
      <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
        <Pill sm active={prayed} color={C.gold} onClick={()=>onPray(post.id)}>🙏 {post.prayerCount+(prayed?1:0)}</Pill>
        <Pill sm color={C.lavender} onClick={()=>onRespond(post)}>💬 {post.responses?.length||"Respond"}</Pill>
        {post.authorId==="me"&&!post.answered&&<Pill sm color={C.sage} onClick={()=>onMarkAnswered(post)}>✅ Answered</Pill>}
        {post.responses?.length>0&&<button onClick={()=>setExp(!exp)} style={{marginLeft:"auto",background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif"}}>{exp?"hide ▴":`${post.responses.length} response${post.responses.length>1?"s":""} ▾`}</button>}
      </div>
      {exp&&post.responses?.map(r=>{const ru=getUser(r.authorId);return(
        <div key={r.id} style={{background:C.bg,borderRadius:10,padding:"8px 10px",marginTop:8,borderLeft:`2px solid ${C.goldDim}`}}>
          <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:4}}><button onClick={()=>onViewProfile(ru.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><Avi user={ru} size={23}/></button><span style={{color:C.text,fontSize:12,fontWeight:600,fontFamily:"Inter,sans-serif"}}>{ru.name}</span>{r.private&&<span style={{background:C.lavDim,color:C.lavender,fontSize:9,padding:"1px 6px",borderRadius:10,fontFamily:"Inter,sans-serif"}}>🔒</span>}<span style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",marginLeft:"auto"}}>{r.time}</span></div>
          <p style={{color:C.textMid,fontSize:13,fontFamily:"Inter,sans-serif",margin:0,lineHeight:1.6}}>{r.text}</p>
        </div>
      );})}
    </div>
  );
}

// ─── SHEETS ───────────────────────────────────────────────────────────────────
function RespondSheet({post,onClose,onSubmit}){
  const [text,setText]=useState(""); const [priv,setPriv]=useState(false); const [ai,setAi]=useState(""); const [aiL,setAiL]=useState(false);
  const a=getUser(post.authorId);
  async function getAI(){setAiL(true);const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:200,messages:[{role:"user",content:`Short heartfelt scripture-grounded prayer response (2-3 sentences): "${post.text}"`}]})});const d=await r.json();setAi(d.content?.find(b=>b.type==="text")?.text||"");setAiL(false);}
  return(
    <Sheet title="Respond in Prayer" onClose={onClose}>
      <div style={{background:C.bg,borderRadius:10,padding:10,marginBottom:12,display:"flex",gap:9,alignItems:"flex-start"}}><Avi user={a} size={26}/><p style={{color:C.textDim,fontSize:13,fontFamily:"Inter,sans-serif",margin:0,lineHeight:1.5,fontStyle:"italic"}}>"{post.text.slice(0,90)}{post.text.length>90?"…":""}"</p></div>
      {ai&&<div style={{background:`${C.gold}0c`,border:`1px solid ${C.goldDim}`,borderRadius:10,padding:11,marginBottom:11}}><div style={{color:C.gold,fontSize:10,fontFamily:"Inter,sans-serif",marginBottom:4}}>✨ SUGGESTED PRAYER</div><p style={{color:"#ddc",fontSize:13,fontFamily:"Inter,sans-serif",margin:0,lineHeight:1.6}}>{ai}</p><button onClick={()=>setText(ai)} style={{marginTop:6,background:C.goldDim,border:`1px solid ${C.gold}44`,borderRadius:8,padding:"3px 10px",color:C.gold,cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif"}}>Use this</button></div>}
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write your prayer…" style={{width:"100%",minHeight:100,background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:12,padding:12,color:C.text,fontSize:14,fontFamily:"Inter,sans-serif",resize:"none",outline:"none",boxSizing:"border-box",lineHeight:1.65}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
        <div style={{display:"flex",gap:7}}><Pill sm active={priv} color={C.lavender} onClick={()=>setPriv(!priv)}>{priv?"🔒 Private":"🌐 Public"}</Pill><Pill sm color={C.gold} onClick={getAI}>{aiL?"…":"✨ AI"}</Pill></div>
        <button onClick={()=>{if(text.trim()){onSubmit(post.id,text,priv);onClose();}}} style={{background:`linear-gradient(135deg,${C.gold},#a07a28)`,border:"none",borderRadius:20,padding:"8px 20px",color:C.bg,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"Inter,sans-serif"}}>Send 🙏</button>
      </div>
    </Sheet>
  );
}
function AnsweredSheet({post,onClose,onConfirm}){
  const [story,setStory]=useState("");
  return(
    <Sheet title="✅ Mark as Answered" onClose={onClose}>
      <p style={{color:C.textMid,fontSize:14,fontFamily:"Inter,sans-serif",lineHeight:1.6,marginBottom:12}}>God answered this prayer. Sharing the story builds faith in everyone who prayed with you.</p>
      <div style={{background:C.bg,borderRadius:10,padding:10,marginBottom:12}}><p style={{color:C.textDim,fontSize:13,fontFamily:"Inter,sans-serif",margin:0,fontStyle:"italic"}}>"{post.text}"</p></div>
      <textarea value={story} onChange={e=>setStory(e.target.value)} placeholder="How did God answer? Even a few words matter… (optional)" style={{width:"100%",minHeight:85,background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:12,padding:12,color:C.text,fontSize:14,fontFamily:"Inter,sans-serif",resize:"none",outline:"none",boxSizing:"border-box",lineHeight:1.65,marginBottom:12}}/>
      <button onClick={()=>{onConfirm(post.id,story);onClose();}} style={{width:"100%",background:`linear-gradient(135deg,${C.sage},#4a7a58)`,border:"none",borderRadius:12,padding:"12px",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"Inter,sans-serif"}}>Share This Testimony ✨</button>
    </Sheet>
  );
}
function ComposeSheet({onClose,onPost}){
  const [text,setText]=useState(""); const [type,setType]=useState("request"); const [passion,setPassion]=useState("faith"); const [audience,setAudience]=useState("all"); const [group,setGroup]=useState(GROUPS[0]?.id||""); const [ml,setMl]=useState("Moment");
  const MTS=["Win","Moment","Milestone","Struggle","Gratitude","Answered 🙏"];
  function submit(){if(!text.trim())return;onPost({text,type,passion,audience,groupId:audience==="group"?group:null,momentLabel:type==="moment"?ml:null});onClose();}
  return(
    <Sheet title="Share with your people ✦" onClose={onClose} maxH="92vh">
      <div style={{display:"flex",gap:8,marginBottom:13}}>{[["request","🙏 Prayer Request",C.gold],["moment","✨ Life Moment",C.blue]].map(([id,lb,col])=><button key={id} onClick={()=>setType(id)} style={{flex:1,background:type===id?`${col}18`:"transparent",border:`1.5px solid ${type===id?col:C.border}`,borderRadius:12,padding:"9px 0",color:type===id?col:C.textDim,cursor:"pointer",fontSize:13,fontFamily:"Inter,sans-serif",fontWeight:type===id?600:400}}>{lb}</button>)}</div>
      {type==="moment"&&<div style={{marginBottom:11}}><div style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",marginBottom:6,letterSpacing:0.8}}>WHAT KIND OF MOMENT?</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{MTS.map(m=><button key={m} onClick={()=>setMl(m)} style={{background:ml===m?`${C.blue}22`:"transparent",border:`1px solid ${ml===m?C.blue:C.border}`,borderRadius:20,padding:"3px 10px",color:ml===m?C.blue:C.textDim,cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif"}}>{m}</button>)}</div></div>}
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={type==="moment"?"What happened? Invite your people into this moment…":"What would you like prayer for?"} style={{width:"100%",minHeight:110,background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:12,padding:13,color:C.text,fontSize:14,fontFamily:"Inter,sans-serif",resize:"none",outline:"none",boxSizing:"border-box",lineHeight:1.65,marginBottom:13}}/>
      <div style={{marginBottom:11}}><div style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",marginBottom:5,letterSpacing:0.8}}>AREA OF LIFE</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{PASSIONS.map(p=><button key={p.id} onClick={()=>setPassion(p.id)} style={{background:passion===p.id?`${p.color}22`:"transparent",border:`1px solid ${passion===p.id?p.color:C.border}`,borderRadius:20,padding:"3px 9px",color:passion===p.id?p.color:C.textDim,cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif"}}>{p.icon} {p.label}</button>)}</div></div>
      <div style={{marginBottom:14}}><div style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",marginBottom:5,letterSpacing:0.8}}>WHO SEES THIS</div><div style={{display:"flex",gap:7}}>{[["all","🌐 Everyone",C.sage],["close","💛 Close",C.gold],["group","🫂 Group",C.blue]].map(([id,lb,col])=><button key={id} onClick={()=>setAudience(id)} style={{flex:1,background:audience===id?`${col}18`:"transparent",border:`1.5px solid ${audience===id?col:C.border}`,borderRadius:10,padding:"8px 0",color:audience===id?col:C.textDim,cursor:"pointer",fontSize:12,fontFamily:"Inter,sans-serif",fontWeight:audience===id?600:400}}>{lb}</button>)}</div>{audience==="group"&&<div style={{marginTop:8}}>{GROUPS.map(g=><button key={g.id} onClick={()=>setGroup(g.id)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:group===g.id?`${g.color}15`:"transparent",border:`1.5px solid ${group===g.id?g.color:C.border}`,borderRadius:10,padding:"8px 11px",cursor:"pointer",marginBottom:5}}><span>{g.icon}</span><span style={{color:group===g.id?g.color:C.text,fontSize:13,fontFamily:"Inter,sans-serif",fontWeight:600}}>{g.name}</span>{group===g.id&&<span style={{marginLeft:"auto",color:g.color}}>✓</span>}</button>)}</div>}</div>
      <button onClick={submit} style={{width:"100%",background:`linear-gradient(135deg,${C.gold},#a07a28)`,border:"none",borderRadius:12,padding:"13px",color:C.bg,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"Inter,sans-serif"}}>Share</button>
    </Sheet>
  );
}

// ─── PROFILE VIEW ─────────────────────────────────────────────────────────────
function ProfileView({userId,posts,prayedSet,onPray,onRespond,onMarkAnswered,onClose}){
  const user=getUser(userId); const isMe=userId==="me"; const isClose=ME.closeFriends.includes(userId); const thread=REL_THREADS[userId]; const accent=AVATAR_COLORS[userId]||C.gold; const [tab,setTab]=useState("prayers");
  const visible=posts.filter(p=>{if(p.authorId!==userId)return false;if(p.audience==="group")return false;if(p.audience==="close")return isMe||isClose;return true;});
  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:500,overflowY:"auto",maxWidth:500,margin:"0 auto"}}>
      <div style={{background:`linear-gradient(160deg,${accent}1e,${C.bg} 65%)`,padding:"16px 16px 0",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={onClose} style={{background:C.surfaceUp,border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 13px",color:C.textMid,cursor:"pointer",fontSize:13,fontFamily:"Inter,sans-serif"}}>← Back</button>
          {!isMe&&<button style={{background:`${accent}18`,border:`1px solid ${accent}44`,borderRadius:20,padding:"6px 13px",color:accent,cursor:"pointer",fontSize:13,fontFamily:"Inter,sans-serif"}}>{isClose?"💛 Close Friend":"+ Follow"}</button>}
        </div>
        <div style={{display:"flex",gap:13,marginBottom:11}}><Avi user={user} size={65} ring/><div style={{flex:1,paddingTop:3}}><div style={{color:C.text,fontWeight:700,fontSize:18,fontFamily:"Cormorant Garamond,serif"}}>{user.name}</div><div style={{color:C.textDim,fontSize:12,fontFamily:"Inter,sans-serif",marginBottom:4}}>{user.handle}</div><p style={{color:C.textMid,fontSize:13,fontFamily:"Inter,sans-serif",margin:"0 0 6px",lineHeight:1.5}}>{user.bio}</p>{user.passions&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{user.passions.map(p=><Tag key={p} passion={p} small/>)}</div>}</div></div>
        {thread?.nudge&&!isMe&&<div style={{background:`${C.gold}12`,border:`1px solid ${C.goldDim}`,borderRadius:10,padding:"8px 12px",marginBottom:11,display:"flex",gap:9,alignItems:"center"}}><span style={{color:C.gold}}>✦</span><span style={{color:C.goldSoft,fontSize:13,fontFamily:"Inter,sans-serif",flex:1}}>{thread.nudge}</span><button style={{background:C.goldDim,border:"none",borderRadius:11,padding:"4px 11px",color:C.gold,cursor:"pointer",fontSize:12,fontFamily:"Inter,sans-serif"}}>Pray</button></div>}
        <div style={{display:"flex",gap:18,paddingBottom:11}}>{[["Requests",visible.length],["Followers",fmtNum(user.followers||0)],["Following",fmtNum(user.following||0)]].map(([l,v])=><div key={l} style={{textAlign:"center"}}><div style={{color:C.text,fontWeight:700,fontSize:15,fontFamily:"Cormorant Garamond,serif"}}>{v}</div><div style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif"}}>{l}</div></div>)}</div>
        <div style={{display:"flex",borderTop:`1px solid ${C.border}`}}>
          {[["prayers","🙏 Prayers"],...((!isMe&&thread)?[["journey","🕊️ Journey"]]:[]),(isMe||isClose)?["close","💛 Close"]:null].filter(Boolean).map(([id,lb])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:"none",border:"none",borderBottom:`2px solid ${tab===id?accent:"transparent"}`,padding:"10px 0",color:tab===id?accent:C.textDim,cursor:"pointer",fontSize:12,fontFamily:"Inter,sans-serif",fontWeight:tab===id?600:400}}>{lb}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"13px 15px 100px"}}>
        {tab==="prayers"&&visible.filter(p=>p.audience!=="close").map(p=><PostCard key={p.id} post={p} prayedSet={prayedSet} onPray={onPray} onRespond={onRespond} onViewProfile={()=>{}} onMarkAnswered={onMarkAnswered}/>)}
        {tab==="close"&&<>{visible.filter(p=>p.audience==="close").map(p=><PostCard key={p.id} post={p} prayedSet={prayedSet} onPray={onPray} onRespond={onRespond} onViewProfile={()=>{}} onMarkAnswered={onMarkAnswered}/>)}{visible.filter(p=>p.audience==="close").length===0&&<p style={{color:C.textDim,fontSize:13,fontFamily:"Inter,sans-serif",textAlign:"center",paddingTop:30}}>No close-friends posts yet.</p>}</>}
        {tab==="journey"&&thread&&<div><div style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",marginBottom:3,letterSpacing:0.8}}>PRAYING TOGETHER SINCE</div><div style={{color:C.goldSoft,fontSize:14,fontFamily:"Cormorant Garamond,serif",marginBottom:14}}>{thread.sharedSince}</div>{thread.history.map((h,i)=><div key={i} style={{display:"flex",gap:11,marginBottom:13}}><div style={{display:"flex",flexDirection:"column",alignItems:"center"}}><div style={{width:9,height:9,borderRadius:"50%",background:h.answered?C.sage:C.goldDim,border:`2px solid ${h.answered?C.sage:C.gold}`,flexShrink:0,marginTop:3}}/>{i<thread.history.length-1&&<div style={{width:1,flex:1,background:C.border,marginTop:3}}/>}</div><div style={{flex:1,paddingBottom:9}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}><span style={{color:C.textDim,fontSize:11,fontFamily:"Inter,sans-serif"}}>{h.date}</span>{h.answered&&<span style={{color:C.sage,fontSize:10,background:`${C.sage}18`,padding:"1px 7px",borderRadius:10,fontFamily:"Inter,sans-serif"}}>✅ Answered</span>}</div><p style={{color:h.answered?C.textMid:C.text,fontSize:13,fontFamily:"Inter,sans-serif",margin:0,lineHeight:1.55}}>{h.text}</p></div></div>)}</div>}
      </div>
    </div>
  );
}

// ─── TODAY / FEED / GROUPS / PEOPLE ──────────────────────────────────────────
function TodayTab({posts,prayedSet,onPray,onRespond,onMarkAnswered,onViewProfile}){
  const [dis,setDis]=useState(new Set()); const ans=posts.filter(p=>p.answered);
  return(
    <div style={{padding:"0 16px 100px"}}>
      <div style={{padding:"18px 0 14px"}}><div style={{color:C.textDim,fontSize:12,fontFamily:"Inter,sans-serif",marginBottom:3}}>Good morning, Grace</div><h1 style={{color:C.text,fontFamily:"Cormorant Garamond,serif",fontSize:26,fontWeight:700,margin:"0 0 4px",lineHeight:1.2}}>Invite God<br/>into your day.</h1></div>
      <div style={{marginBottom:16}}><div style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",letterSpacing:0.8,marginBottom:8}}>MOMENTS WORTH PRAYING</div>
        {DAILY_NUDGES.filter(n=>!dis.has(n.id)).map(n=>(
          <div key={n.id} style={{background:`linear-gradient(155deg,${C.surfaceUp},${C.surface})`,border:`1px solid ${C.borderMid}`,borderRadius:14,padding:"11px 12px",marginBottom:7,display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:36,height:36,borderRadius:10,background:C.surfaceUp,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{n.icon}</div>
            <div style={{flex:1}}><p style={{color:C.text,fontSize:13,fontFamily:"Inter,sans-serif",margin:"0 0 5px",lineHeight:1.45}}>{n.type==="relationship"?<><button onClick={()=>onViewProfile(n.userId)} style={{background:"none",border:"none",cursor:"pointer",padding:0,color:C.goldSoft,fontWeight:600,fontSize:13,fontFamily:"Inter,sans-serif"}}>{getUser(n.userId).name}</button> — {n.text}</>:n.text}</p><div style={{display:"flex",gap:6}}><button style={{background:C.goldDim,border:`1px solid ${C.gold}44`,borderRadius:10,padding:"3px 10px",color:C.gold,cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif"}}>{n.cta}</button><button onClick={()=>setDis(p=>new Set([...p,n.id]))} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif"}}>Later</button></div></div>
          </div>
        ))}
      </div>
      {ans.length>0&&<div style={{marginBottom:16}}><div style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",letterSpacing:0.8,marginBottom:8}}>✅ ANSWERED PRAYERS</div>{ans.map(p=><PostCard key={p.id} post={p} prayedSet={prayedSet} onPray={onPray} onRespond={onRespond} onViewProfile={onViewProfile} onMarkAnswered={onMarkAnswered}/>)}</div>}
      <div><div style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",letterSpacing:0.8,marginBottom:8}}>RECENT FROM YOUR PEOPLE</div>{posts.slice(0,4).map(p=><PostCard key={p.id} post={p} prayedSet={prayedSet} onPray={onPray} onRespond={onRespond} onViewProfile={onViewProfile} onMarkAnswered={onMarkAnswered}/>)}</div>
    </div>
  );
}
function FeedTab({posts,prayedSet,onPray,onRespond,onMarkAnswered,onViewProfile}){
  const [filter,setFilter]=useState("all"); const [passion,setPassion]=useState(null);
  const shown=posts.filter(p=>{if(p.audience==="close"&&!ME.closeFriends.includes(p.authorId)&&p.authorId!=="me")return false;if(p.audience==="group"){const g=GROUPS.find(g=>g.id===p.groupId);return g?.members.includes("me");}if(filter==="close"&&p.audience!=="close")return false;if(filter==="moments"&&p.type!=="moment")return false;if(passion&&p.passion!==passion)return false;return true;});
  return(
    <div style={{padding:"0 16px 100px"}}>
      <div style={{padding:"10px 0 8px"}}><div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:7}}>{[["all","All"],["moments","✨ Moments"],["close","💛 Close"]].map(([id,lb])=><Pill key={id} active={filter===id} color={id==="close"?C.gold:id==="moments"?C.blue:C.sage} onClick={()=>setFilter(id)}>{lb}</Pill>)}</div><div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}><button onClick={()=>setPassion(null)} style={{background:!passion?`${C.sage}20`:"transparent",border:`1px solid ${!passion?C.sage:C.border}`,borderRadius:20,padding:"3px 10px",color:!passion?C.sage:C.textDim,cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif",flexShrink:0}}>All</button>{PASSIONS.map(p=><button key={p.id} onClick={()=>setPassion(passion===p.id?null:p.id)} style={{background:passion===p.id?`${p.color}20`:"transparent",border:`1px solid ${passion===p.id?p.color:C.border}`,borderRadius:20,padding:"3px 8px",color:passion===p.id?p.color:C.textDim,cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif",flexShrink:0}}>{p.icon}</button>)}</div></div>
      {shown.map(p=><PostCard key={p.id} post={p} prayedSet={prayedSet} onPray={onPray} onRespond={onRespond} onViewProfile={onViewProfile} onMarkAnswered={onMarkAnswered}/>)}
    </div>
  );
}
function GroupsTab({posts,prayedSet,onPray,onRespond,onMarkAnswered,onViewProfile}){
  const [open,setOpen]=useState(null);
  if(open){const g=open;const gp=posts.filter(p=>p.groupId===g.id);const mem=g.members.map(getUser);return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:400,overflowY:"auto",maxWidth:500,margin:"0 auto"}}>
      <div style={{background:`linear-gradient(155deg,${g.color}1a,${C.bg} 55%)`,padding:"16px 16px 0",borderBottom:`1px solid ${C.border}`}}>
        <button onClick={()=>setOpen(null)} style={{background:C.surfaceUp,border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 13px",color:C.textMid,cursor:"pointer",fontSize:13,fontFamily:"Inter,sans-serif",marginBottom:12}}>← Back</button>
        <div style={{fontSize:28,marginBottom:4}}>{g.icon}</div><h2 style={{color:C.text,fontFamily:"Cormorant Garamond,serif",fontSize:21,fontWeight:700,margin:"0 0 3px"}}>{g.name}</h2>
        <div style={{display:"flex",alignItems:"center",marginBottom:12}}>{mem.map((u,i)=><div key={u.id} onClick={()=>onViewProfile(u.id)} style={{marginLeft:i>0?-8:0,cursor:"pointer"}}><Avi user={u} size={28}/></div>)}<span style={{color:C.textDim,fontSize:12,fontFamily:"Inter,sans-serif",marginLeft:11}}>{mem.length} members</span></div>
      </div>
      <div style={{padding:"13px 15px 100px"}}>{gp.length===0?<p style={{color:C.textDim,fontSize:14,fontFamily:"Inter,sans-serif",textAlign:"center",paddingTop:40}}>No group prayer requests yet.</p>:gp.map(p=><PostCard key={p.id} post={p} prayedSet={prayedSet} onPray={onPray} onRespond={onRespond} onViewProfile={onViewProfile} onMarkAnswered={onMarkAnswered}/>)}</div>
    </div>
  );}
  return(
    <div style={{padding:"0 16px 100px"}}>
      <div style={{padding:"16px 0 12px"}}><h2 style={{color:C.text,fontFamily:"Cormorant Garamond,serif",fontSize:24,fontWeight:700,margin:"0 0 4px"}}>Prayer Groups</h2><p style={{color:C.textMid,fontSize:13,fontFamily:"Inter,sans-serif",margin:0}}>Shared spaces for the communities you live in</p></div>
      {GROUPS.map(g=>{const gp=posts.filter(p=>p.groupId===g.id);const mem=g.members.slice(0,4).map(getUser);return(
        <button key={g.id} onClick={()=>setOpen(g)} style={{display:"block",width:"100%",background:`linear-gradient(155deg,${C.surfaceUp},${C.surface})`,border:`1px solid ${g.color}22`,borderRadius:16,padding:"13px",marginBottom:9,cursor:"pointer",textAlign:"left"}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><div style={{width:43,height:43,borderRadius:12,background:`${g.color}1a`,border:`1px solid ${g.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>{g.icon}</div><div style={{flex:1}}><div style={{color:g.color,fontWeight:700,fontSize:14,fontFamily:"Inter,sans-serif",marginBottom:6}}>{g.name}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center"}}>{mem.map((u,i)=><div key={u.id} style={{marginLeft:i>0?-8:0}}><Avi user={u} size={24}/></div>)}<span style={{color:C.textDim,fontSize:11,fontFamily:"Inter,sans-serif",marginLeft:9}}>{g.members.length} members</span></div><span style={{color:C.textDim,fontSize:11,fontFamily:"Inter,sans-serif"}}>🙏 {gp.length}</span></div></div></div>
        </button>
      );})}
      <button style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,width:"100%",background:"transparent",border:`1.5px dashed ${C.border}`,borderRadius:16,padding:"14px",cursor:"pointer",color:C.textDim,fontSize:14,fontFamily:"Inter,sans-serif"}}>+ Create a Prayer Group</button>
    </div>
  );
}
function PeopleTab({posts,prayedSet,onPray,onRespond,onMarkAnswered,onViewProfile}){
  return(
    <div style={{padding:"0 16px 100px"}}>
      <div style={{padding:"16px 0 12px"}}><h2 style={{color:C.text,fontFamily:"Cormorant Garamond,serif",fontSize:24,fontWeight:700,margin:"0 0 4px"}}>Your People</h2><p style={{color:C.textMid,fontSize:13,fontFamily:"Inter,sans-serif",margin:0}}>Relationships worth investing in</p></div>
      <div style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",letterSpacing:0.8,marginBottom:9}}>CLOSE FRIENDS</div>
      {ME.closeFriends.map(uid=>{const u=getUser(uid);const thread=REL_THREADS[uid];const up=posts.filter(p=>p.authorId===uid&&p.audience!=="group");const ans=up.filter(p=>p.answered).length;return(
        <button key={uid} onClick={()=>onViewProfile(uid)} style={{display:"flex",gap:11,alignItems:"flex-start",width:"100%",background:`linear-gradient(155deg,${C.surfaceUp},${C.surface})`,border:`1px solid ${C.gold}22`,borderRadius:16,padding:"12px",marginBottom:9,cursor:"pointer",textAlign:"left"}}>
          <div style={{position:"relative"}}><Avi user={u} size={44} ring/><div style={{position:"absolute",bottom:-2,right:-2,width:14,height:14,borderRadius:"50%",background:C.gold,border:`2px solid ${C.bg}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8}}>💛</div></div>
          <div style={{flex:1}}><div style={{color:C.text,fontWeight:600,fontSize:14,fontFamily:"Inter,sans-serif",marginBottom:2}}>{u.name}</div>{thread?.nudge?<p style={{color:C.goldSoft,fontSize:12,fontFamily:"Inter,sans-serif",margin:"0 0 4px",lineHeight:1.4}}>{thread.nudge}</p>:<p style={{color:C.textDim,fontSize:12,fontFamily:"Inter,sans-serif",margin:"0 0 4px"}}>Since {thread?.sharedSince}</p>}<div style={{display:"flex",gap:7}}><span style={{color:C.textDim,fontSize:11,fontFamily:"Inter,sans-serif"}}>🙏 {up.length}</span>{ans>0&&<span style={{color:C.sage,fontSize:11,fontFamily:"Inter,sans-serif"}}>✅ {ans} answered</span>}</div></div>
        </button>
      );})}
      <div style={{color:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",letterSpacing:0.8,margin:"14px 0 9px"}}>ALSO FOLLOWING</div>
      {Object.values(USERS).filter(u=>!ME.closeFriends.includes(u.id)).map(u=>(
        <button key={u.id} onClick={()=>onViewProfile(u.id)} style={{display:"flex",gap:10,alignItems:"center",width:"100%",background:`linear-gradient(155deg,${C.surfaceUp},${C.surface})`,border:`1px solid ${C.border}`,borderRadius:14,padding:"10px 12px",marginBottom:7,cursor:"pointer",textAlign:"left"}}>
          <Avi user={u} size={38}/><div style={{flex:1}}><div style={{color:C.text,fontWeight:600,fontSize:13.5,fontFamily:"Inter,sans-serif"}}>{u.name}</div><div style={{display:"flex",gap:5,marginTop:3}}>{u.passions?.slice(0,3).map(p=><Tag key={p} passion={p} small/>)}</div></div><span style={{color:C.textDim,fontSize:18}}>›</span>
        </button>
      ))}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [posts,setPosts]     = useState(seed());
  const [prayedSet,setPrayed]= useState(new Set());
  const [tab,setTab]         = useState("today");
  const [compose,setCompose] = useState(false);
  const [respond,setRespond] = useState(null);
  const [ansPost,setAnsPost] = useState(null);
  const [profile,setProfile] = useState(null);
  const [threeOk,setThreeOk] = useState(!!window.THREE);

  useEffect(()=>{
    if(window.THREE){ setThreeOk(true); return; }
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.onload=()=>setThreeOk(true);
    document.head.appendChild(s);
  },[]);

  const onPray = id => setPrayed(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const onPost = d => setPosts(p=>[{id:Date.now(),authorId:"me",type:d.type,passion:d.passion,audience:d.audience,groupId:d.groupId,text:d.text,momentLabel:d.momentLabel,prayerCount:0,responses:[],time:"Just now",answered:false,answeredText:null},...p]);
  const onRespond = (pid,text,priv) => setPosts(p=>p.map(x=>x.id!==pid?x:{...x,responses:[...(x.responses||[]),{id:Date.now()+"",authorId:"me",text,time:"Just now",private:priv}]}));
  const onMarkAnswered = (pid,story) => setPosts(p=>p.map(x=>x.id!==pid?x:{...x,answered:true,answeredText:story||null}));

  const sp = {posts,prayedSet,onPray,onRespond:setRespond,onMarkAnswered:p=>setAnsPost(p),onViewProfile:setProfile};
  const NAV = [{id:"today",icon:"✦",label:"Today"},{id:"feed",icon:"🌊",label:"Feed"},{id:"world",icon:"🌍",label:"World"},{id:"groups",icon:"🫂",label:"Groups"},{id:"people",icon:"🤝",label:"People"}];

  return(
    <div style={{background:C.bg,height:"100vh",maxWidth:500,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        ::-webkit-scrollbar{width:0;}
        body{margin:0;}
      `}</style>

      {/* Header */}
      <div style={{background:`${C.bg}f0`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.border}`,padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,zIndex:200}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:C.gold,fontSize:16,fontWeight:700}}>✦</span>
          <span style={{color:C.text,fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:700,letterSpacing:0.5}}>Allelon</span>
        </div>
        <div style={{display:"flex",gap:9,alignItems:"center"}}>
          <button onClick={()=>setCompose(true)} style={{background:`linear-gradient(135deg,${C.gold},#9a7020)`,border:"none",borderRadius:20,padding:"7px 16px",color:C.bg,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"Inter,sans-serif"}}>+ Share</button>
          <button onClick={()=>setProfile("me")} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><Avi user={ME} size={32}/></button>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,minHeight:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {tab==="world" ? (
          threeOk
            ? <WorldTab/>
            : <div style={{display:"flex",alignItems:"center",justifyContent:"center",flex:1,color:C.textMid,fontFamily:"Inter,sans-serif",fontSize:14}}>Loading…</div>
        ) : (
          <div style={{flex:1,overflowY:"auto"}}>
            {tab==="today"  && <TodayTab  {...sp}/>}
            {tab==="feed"   && <FeedTab   {...sp}/>}
            {tab==="groups" && <GroupsTab {...sp}/>}
            {tab==="people" && <PeopleTab {...sp}/>}
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{background:`${C.bg}f5`,backdropFilter:"blur(16px)",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"8px 0 14px",flexShrink:0,zIndex:200}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 8px"}}>
            <span style={{fontSize:tab===n.id?20:18,color:tab===n.id?C.gold:C.textDim,filter:tab===n.id?"none":"opacity(0.35)",transition:"all 0.15s"}}>{n.icon}</span>
            <span style={{color:tab===n.id?C.gold:C.textDim,fontSize:10,fontFamily:"Inter,sans-serif",fontWeight:tab===n.id?700:400}}>{n.label}</span>
          </button>
        ))}
      </div>

      {compose  && <ComposeSheet  onClose={()=>setCompose(false)} onPost={onPost}/>}
      {respond  && <RespondSheet  post={respond}  onClose={()=>setRespond(null)}  onSubmit={onRespond}/>}
      {ansPost  && <AnsweredSheet post={ansPost}  onClose={()=>setAnsPost(null)}  onConfirm={onMarkAnswered}/>}
      {profile  && <ProfileView   userId={profile} posts={posts} prayedSet={prayedSet} onPray={onPray} onRespond={setRespond} onMarkAnswered={p=>setAnsPost(p)} onClose={()=>setProfile(null)}/>}
    </div>
  );
}
