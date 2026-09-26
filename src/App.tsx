import {useEffect,useState} from 'react';
import JammieRush from './levels/jammie-rush/JammieRush';
import {StudentWellnessServicesWanted} from './levels/student-wellness/missions/StudentWellnessServicesWanted';
import SocietyFair from './levels/society-fair/SocietyFair';
import {OperationStudentCard} from './levels/student-card/missions/OperationStudentCard';

type Screen='login'|'map'|'brief'|'level';
type Pos={x:number;y:number};
const NPC:Record<number,string>={6:'/assets/npcs/npc6/down.png',7:'/assets/npcs/npc7/down.png',8:'/assets/npcs/npc8/down.png'};
const missions=[
 {title:'Jammie Rush',desc:'MISSION: Make your way to the Jammie stop, navigate the route to Hiddingh Campus, and survive the Jammie Rush. Learn how to use the campus shuttle system before time runs out!',x:84,y:45},
 {title:'Student Wellness Services Wanted',desc:'MISSION: Kirah needs your help. Navigate across campus, find her, and discover where Student Wellness Services is located and how it can support you.',x:63,y:25},
 {title:'Society Fair',desc:'MISSION: Head to the Society Fair and explore campus life beyond lectures. Meet the societies, complete their challenges, and find a community that matches your interests.',x:36,y:73},
 {title:'Operation: Student Card',desc:'MISSION: Your final orientation task is to secure your student card. Navigate to the correct campus service, complete the process, and unlock your official access to campus.',x:78,y:78}
];

export default function App(){
 const [screen,setScreen]=useState<Screen>('login'); const [name,setName]=useState(''); const [num,setNum]=useState(''); const [npc,setNpc]=useState(6); const [mission,setMission]=useState(0); const [pos,setPos]=useState<Pos>({x:50,y:92});
 const complete=()=>{setMission(m=>Math.min(4,m+1));setPos({x:50,y:92});setScreen('map')};
 if(screen==='login') return <Login name={name} num={num} npc={npc} setName={setName} setNum={setNum} setNpc={setNpc} onStart={()=>{if(name.trim()&&num.trim())setScreen('map');else alert('Enter a nickname and student number.')}}/>;
 if(screen==='level') return <Level mission={mission} complete={complete} exit={()=>setScreen('map')}/>;
 if(screen==='brief') return <Brief mission={mission} start={()=>setScreen('level')} back={()=>setScreen('map')}/>;
 return <CampusMap name={name} num={num} npc={npc} mission={mission} pos={pos} setPos={setPos} openBrief={()=>setScreen('brief')}/>;
}
function Login({name,num,npc,setName,setNum,setNpc,onStart}:any){return <div className="screen login"><div className="login-card"><div className="title">CAMPUS <span>QUEST</span></div><div className="sub">Choose your campus explorer, then begin orientation.</div><div className="login-grid"><div><b>Choose your NPC</b><div className="avatars">{[6,7,8].map(n=><button key={n} className={`avatar ${npc===n?'sel':''}`} onClick={()=>setNpc(n)}><img src={NPC[n]}/><b>Explorer {n}</b></button>)}</div></div><div className="fields"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nickname"/><input value={num} onChange={e=>setNum(e.target.value)} placeholder="Student number"/><button className="primary" onClick={onStart}>START CAMPUS QUEST</button></div></div></div></div>}
function CampusMap({name,num,npc,mission,pos,setPos,openBrief}:any){
 useEffect(()=>{if(mission>=4)return;const move=(e:KeyboardEvent)=>{let dx=0,dy=0,k=e.key.toLowerCase();if(k==='a'||k==='arrowleft')dx=-2;if(k==='d'||k==='arrowright')dx=2;if(k==='w'||k==='arrowup')dy=-2;if(k==='s'||k==='arrowdown')dy=2;if(!dx&&!dy)return;e.preventDefault();setPos((p:Pos)=>{const n={x:Math.max(4,Math.min(96,p.x+dx)),y:Math.max(8,Math.min(96,p.y+dy))};const t=missions[mission];if(Math.hypot(n.x-t.x,n.y-t.y)<5)setTimeout(openBrief,0);return n})};addEventListener('keydown',move);return()=>removeEventListener('keydown',move)},[mission,openBrief,setPos]);
 const m=missions[Math.min(mission,3)]; return <div className="screen map"><img className="map-bg" src="/assets/campus-map.png"/><div className="shade"/><div className="hud"><h2>🧭 {name}'s Campus Quest</h2><small>{num} · Explorer {npc}</small><div className="mission-card"><b>MISSION {Math.min(mission+1,4)} OF 4</b><strong>{mission<4?m.title:'Orientation Complete!'}</strong><p>{mission<4?m.desc:'You completed all four orientation missions.'}</p></div><div className="progress">{missions.map((_,i)=><i key={i} className={`dot ${i<mission?'done':i===mission?'active':''}`}/>)}</div></div>{missions.map((q,i)=><button key={i} className={`marker ${i<mission?'done':i>mission?'lock':''}`} style={{left:`${q.x}%`,top:`${q.y}%`}} onClick={()=>{if(i===mission){setPos({x:q.x,y:q.y});openBrief()}}}>{i<mission?'✓':i+1}</button>)}<div className="player" style={{left:`${pos.x}%`,top:`${pos.y}%`}}><img src={NPC[npc]}/></div><div className="tip">WASD / arrow keys to explore · reach the glowing mission marker</div></div>
}
function Brief({mission,start,back}:any){const m=missions[mission];return <div className="screen map"><img className="map-bg" src="/assets/campus-map.png"/><div className="shade"/><div className="modal"><div className="brief"><div className="kicker">MISSION {mission+1}</div><h1>{m.title}</h1><p>{m.desc}</p>{mission===0&&<div className="route"><span className="stop">UPPER CAMPUS</span><i className="line"/><span className="stop">JAMMIE STOP</span><i className="line"/><span className="stop">J2 · HIDDINGH</span></div>}<button className="primary" onClick={start}>BEGIN MISSION</button> <button className="secondary" onClick={back}>BACK TO MAP</button></div></div></div>}
function Level({mission,complete,exit}:any){if(mission===0)return <div className="level-shell level-jammie"><JammieRush onComplete={complete} onExit={exit}/></div>;if(mission===1)return <div className="level-shell level-wellness"><StudentWellnessServicesWanted onMissionComplete={complete} onExitToMap={exit}/></div>;if(mission===2)return <div className="level-shell level-society"><SocietyFair onComplete={complete} onExit={exit}/></div>;return <div className="level-shell level-card"><OperationStudentCard onMissionComplete={()=>complete()} onExitToMap={exit}/></div>}
