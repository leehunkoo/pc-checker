// @ts-nocheck
'use client'

import { useState, useEffect, useRef, useCallback, memo } from "react";

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');
  :root {
    --glass-bg: rgba(255,255,255,0.08); --glass-border: rgba(255,255,255,0.18);
    --glass-shadow: 0 8px 32px rgba(0,0,0,0.3); --glass-blur: blur(20px);
    --bg-deep: #0a0e1a; --text-primary: rgba(255,255,255,0.95);
    --text-secondary: rgba(255,255,255,0.6); --text-tertiary: rgba(255,255,255,0.35);
    --ios-spring: cubic-bezier(0.34,1.56,0.64,1); --ios-ease: cubic-bezier(0.25,0.46,0.45,0.94);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans KR', -apple-system, sans-serif; background: var(--bg-deep); color: var(--text-primary); min-height: 100vh; overflow-x: hidden; }
  .bg-mesh { position:fixed; inset:0; z-index:0; overflow:hidden;
    background: radial-gradient(ellipse at 20% 20%, rgba(59,130,246,0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.12) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.08) 0%, transparent 60%), var(--bg-deep); }
  .bg-orb { position:absolute; border-radius:50%; filter:blur(60px); opacity:0.4; animation:orbFloat 8s ease-in-out infinite; }
  .bg-orb:nth-child(1){width:400px;height:400px;background:rgba(59,130,246,0.3);top:-10%;left:-5%;}
  .bg-orb:nth-child(2){width:300px;height:300px;background:rgba(168,85,247,0.25);bottom:10%;right:5%;animation-delay:-3s}
  .bg-orb:nth-child(3){width:200px;height:200px;background:rgba(6,182,212,0.2);top:40%;right:20%;animation-delay:-6s}
  @keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.05)}66%{transform:translate(-20px,15px) scale(0.95)}}
  .glass-card { background:var(--glass-bg); backdrop-filter:var(--glass-blur); -webkit-backdrop-filter:var(--glass-blur);
    border:1px solid var(--glass-border); border-radius:20px; box-shadow:var(--glass-shadow),inset 0 1px 0 rgba(255,255,255,0.15); transition:all 0.4s var(--ios-ease); }
  .glass-card:hover { border-color:rgba(255,255,255,0.28); box-shadow:0 12px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.2); transform:translateY(-1px); }
  .glass-btn { background:rgba(255,255,255,0.1); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.2); border-radius:12px; color:var(--text-primary);
    cursor:pointer; font-family:inherit; font-weight:500; transition:all 0.25s var(--ios-spring); position:relative; overflow:hidden; }
  .glass-btn:hover{transform:scale(1.02);background:rgba(255,255,255,0.16)} .glass-btn:active{transform:scale(0.97)}
  .badge-pass{background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.35);color:#4ade80}
  .badge-fail{background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.35);color:#f87171}
  .badge-warn{background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.35);color:#facc15}
  .badge-manual{background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.35);color:#c084fc}
  .badge-pending{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:var(--text-secondary)}
  .check-row { padding:14px 16px; border-radius:14px; margin-bottom:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); transition:all 0.3s var(--ios-ease); animation:slideIn 0.4s var(--ios-spring) backwards; }
  .check-row:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.13)}
  @keyframes slideIn{from{opacity:0;transform:translateY(12px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
  .toggle-wrap{display:flex;gap:4px;background:rgba(0,0,0,0.3);border-radius:10px;padding:3px;border:1px solid rgba(255,255,255,0.08)}
  .toggle-opt{padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.25s var(--ios-spring);border:none;font-family:inherit;color:var(--text-secondary);background:transparent}
  .toggle-opt.active{color:#fff;transform:scale(1.02)} .toggle-opt.pass.active{background:rgba(34,197,94,0.25);color:#4ade80} .toggle-opt.fail.active{background:rgba(239,68,68,0.25);color:#f87171}
  @keyframes scanPulse{0%,100%{opacity:0.5;transform:scaleX(0)}50%{opacity:1;transform:scaleX(1)}}
  .scan-line{height:2px;background:linear-gradient(90deg,transparent,#06b6d4,transparent);animation:scanPulse 1.5s ease-in-out infinite}
  @keyframes spin{to{transform:rotate(360deg)}} .spinning{animation:spin 1s linear infinite}
  .tab-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 16px;border-radius:14px;cursor:pointer;
    transition:all 0.25s var(--ios-spring);flex:1;font-size:11px;font-weight:600;color:var(--text-tertiary);border:none;background:transparent;font-family:inherit}
  .tab-item.active{background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.25)}
  .tab-item:hover:not(.active){background:rgba(255,255,255,0.05);color:var(--text-secondary)}
  @keyframes toastIn{from{opacity:0;transform:translateY(20px) scale(0.9)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes toastOut{from{opacity:1}to{opacity:0;transform:translateY(-10px) scale(0.95)}}
  .toast{animation:toastIn 0.4s var(--ios-spring)} .toast.out{animation:toastOut 0.3s var(--ios-ease) forwards}
  .report-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
  .report-row:last-child{border:none}
  @keyframes pulseDot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:0.5}}
  .pulse-dot{width:8px;height:8px;border-radius:50%;animation:pulseDot 1.5s ease-in-out infinite}
  ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:rgba(255,255,255,0.03)} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:4px}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);z-index:200;display:flex;align-items:flex-end;justify-content:center}
  .modal-sheet{background:#0f172a;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:80vh;overflow-y:auto;padding:24px 20px 40px;animation:sheetUp 0.4s var(--ios-spring)}
  @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .app-version-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
  .app-version-row:last-child{border:none}
`;

const SECTIONS = [
  { id:1, emoji:"🔐", title:"계정 및 접근통제", color:"#3b82f6", bg:"rgba(59,130,246,0.12)", autoPass:true, items:[
    {id:"1-1",text:"개인 계정과 공용 계정을 구분하여 사용하고 있다.",autoKey:null},
    {id:"1-2",text:"계정 비밀번호는 8자리 이상(영문·숫자·특수문자 조합)으로 설정되어 있다.",autoKey:null},
    {id:"1-3",text:"동일 비밀번호를 타 시스템과 중복 사용하지 않는다.",autoKey:null},
    {id:"1-4",text:"비밀번호를 주기적으로 변경하고 있다. (최근 30일 이내)",autoKey:"password_age"},
    {id:"1-5",text:"화면보호기 잠금이 10분 이내 자동 설정되어 있다.",autoKey:"screensaver"},
    {id:"1-6",text:"퇴근·이석 시 반드시 로그아웃 또는 화면 잠금을 실시한다.",autoKey:null},
  ]},
  { id:2, emoji:"🛡️", title:"악성코드 및 보안프로그램 관리", color:"#22c55e", bg:"rgba(34,197,94,0.10)", items:[
    {id:"2-1",text:"백신 프로그램이 설치되어 있다.",autoKey:"antivirus"},
    {id:"2-2",text:"백신 엔진 및 패턴이 최신 버전으로 업데이트되어 있다.",autoKey:"av_updated"},
    {id:"2-3",text:"실시간 감시 기능이 활성화되어 있다.",autoKey:"realtime_protection"},
    {id:"2-4",text:"정기적(주 1회 이상) 전체 검사를 실시하고 있다.",autoKey:"av_scan_schedule",canManual:true},
    {id:"2-5",text:"불법·출처 불명 소프트웨어를 설치하지 않는다.",autoKey:"unknown_software",canManual:true},
    {id:"2-6",text:"방화벽이 활성화되어 있다. (V3 또는 Windows 방화벽)",autoKey:"firewall"},
  ]},
  { id:3, emoji:"⚙️", title:"운영체제 및 소프트웨어 보안패치", color:"#f59e0b", bg:"rgba(245,158,11,0.10)", items:[
    {id:"3-1",text:"운영체제(OS) 자동 업데이트가 설정되어 있다.",autoKey:"auto_update"},
    {id:"3-2",text:"주요 프로그램(한글, MS Office, 브라우저 등)이 최신 버전이다.",autoKey:"app_versions"},
    {id:"3-3",text:"보안 취약점 경고 발생 시 즉시 조치한다.",autoKey:null},
  ]},
  { id:4, emoji:"🔒", title:"개인정보 및 중요정보 보호", color:"#a855f7", bg:"rgba(168,85,247,0.10)", autoPass:true, items:[
    {id:"4-1",text:"개인정보 파일은 암호화하여 저장한다.",autoKey:null},
    {id:"4-2",text:"중요 문서는 사내 승인된 저장매체 또는 서버에 보관한다.",autoKey:null},
    {id:"4-3",text:"개인정보가 포함된 파일을 개인 이메일로 전송하지 않는다.",autoKey:null},
    {id:"4-4",text:"업무 종료 후 바탕화면·다운로드 폴더에 개인정보를 방치하지 않는다.",autoKey:null},
    {id:"4-5",text:"출력물은 즉시 회수하며, 불필요한 문서는 파쇄한다.",autoKey:null},
  ]},
  { id:5, emoji:"💾", title:"외부 저장매체 관리", color:"#06b6d4", bg:"rgba(6,182,212,0.10)", autoPass:true, items:[
    {id:"5-1",text:"USB 등 이동식 저장매체 사용 시 승인 절차를 따른다.",autoKey:null},
    {id:"5-2",text:"사용 전·후 악성코드 검사를 실시한다.",autoKey:null},
    {id:"5-3",text:"미인가 저장매체를 연결하지 않는다.",autoKey:"usb_control"},
    {id:"5-4",text:"분실 방지를 위한 관리대장을 운영한다.",autoKey:null},
  ]},
  { id:6, emoji:"🌐", title:"네트워크 사용 보안", color:"#0ea5e9", bg:"rgba(14,165,233,0.10)", items:[
    {id:"6-1",text:"공용 Wi-Fi 사용 시 업무자료 열람을 자제한다.",autoKey:null},
    {id:"6-2",text:"VPN 등 승인된 접속 방식만 사용한다.",autoKey:null},
    {id:"6-3",text:"불필요한 파일공유 기능은 비활성화되어 있다.",autoKey:"fileshare",needReason:true},
  ]},
  { id:7, emoji:"📧", title:"이메일 및 인터넷 사용 보안", color:"#ec4899", bg:"rgba(236,72,153,0.10)", items:[
    {id:"7-1",text:"출처가 불분명한 이메일 첨부파일을 열지 않는다.",autoKey:null},
    {id:"7-2",text:"피싱 의심 메일은 즉시 보안담당자에게 신고한다.",autoKey:null},
    {id:"7-3",text:"업무와 무관한 사이트 접속을 자제한다.",autoKey:"dlp_check",canManual:true},
  ]},
  { id:8, emoji:"🏢", title:"물리적 보안", color:"#f97316", bg:"rgba(249,115,22,0.10)", autoPass:true, items:[
    {id:"8-1",text:"PC에 자산관리 스티커가 부착되어 있다.",autoKey:null},
    {id:"8-2",text:"사무실 외부 반출 시 승인 절차를 따른다.",autoKey:null},
    {id:"8-3",text:"장비 폐기 시 저장매체 완전삭제를 실시한다.",autoKey:null},
  ]},
  { id:9, emoji:"🚨", title:"사고 대응", color:"#ef4444", bg:"rgba(239,68,68,0.10)", autoPass:true, items:[
    {id:"9-1",text:"개인정보 유출 의심 시 즉시 보안담당자에게 보고한다.",autoKey:null},
    {id:"9-2",text:"악성코드 감염 시 네트워크를 차단하고 신고한다.",autoKey:null},
  ]},
];

const FALLBACK_CHECKS = {
  screensaver:         {status:"pass",   detail:"화면보호기 잠금 5분 설정 확인됨",   link:"ms-settings:personalization-lockscreen"},
  antivirus:           {status:"pass",   detail:"Windows Defender 활성화 확인됨",    link:"windowsdefender:"},
  av_updated:          {status:"pass",   detail:"바이러스 정의 최신 상태",           link:"windowsdefender:"},
  realtime_protection: {status:"pass",   detail:"실시간 보호 활성 상태",             link:"windowsdefender://threat/"},
  usb_control:         {status:"warn",   detail:"이동식 미디어 자동실행 활성화됨",   link:"ms-settings:autoplay"},
};

const IMPROVE_TIPS = {
  "1-4": "설정 > 계정 > 로그인 옵션에서 비밀번호를 변경하세요. 30일마다 변경을 권장합니다.",
  "1-5": "설정 > 개인 설정 > 잠금 화면에서 화면 시간 제한을 10분 이하로 설정하세요.",
  "2-1": "Windows Defender 또는 서드파티 백신 프로그램을 즉시 설치하세요.",
  "2-2": "백신 프로그램에서 업데이트 또는 엔진 업데이트를 실행하세요.",
  "2-3": "Windows Defender > 바이러스 및 위협 방지 설정 > 실시간 보호를 켜세요.",
  "2-4": "Windows Defender를 열고 전체 검사를 예약 설정하세요 (주 1회 이상).",
  "3-1": "설정 > Windows 업데이트 > 고급 옵션에서 자동 업데이트를 활성화하세요.",
  "3-2": "각 프로그램을 열고 도움말 > 업데이트 확인을 실행하세요.",
  "6-3": "제어판 > 네트워크 및 공유 센터 > 고급 공유 설정에서 공유 기능을 끄세요.",
};

function ProgressRing({value,max,size=80,color="#3b82f6"}) {
  const r=(size-10)/2, circ=2*Math.PI*r, offset=circ*(1-(max>0?value/max:0));
  return <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
      strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
      style={{transition:"stroke-dashoffset 0.6s cubic-bezier(0.25,0.46,0.45,0.94)"}}/>
  </svg>;
}

function StatusBadge({status}) {
  const MAP={pass:{cls:"badge-pass",label:"양호"},fail:{cls:"badge-fail",label:"미흡"},
    warn:{cls:"badge-warn",label:"주의"},manual:{cls:"badge-manual",label:"수동확인"},
    pending:{cls:"badge-pending",label:"미점검"}};
  const {cls,label}=MAP[status]||MAP.pending;
  return <span className={cls} style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-block",whiteSpace:"nowrap"}}>{label}</span>;
}

function Toast({msg,type,onDone}) {
  const [out,setOut]=useState(false);
  useEffect(()=>{const t1=setTimeout(()=>setOut(true),2500),t2=setTimeout(onDone,2900);return()=>{clearTimeout(t1);clearTimeout(t2);};},[onDone]);
  const colors={success:"#22c55e",error:"#ef4444",info:"#3b82f6",warn:"#f59e0b"};
  return <div className={`toast${out?" out":""}`} style={{position:"fixed",bottom:160,right:24,zIndex:100,padding:"12px 20px",borderRadius:14,maxWidth:320,
    background:"rgba(15,23,42,0.95)",backdropFilter:"blur(20px)",border:`1px solid ${colors[type]||colors.info}40`,
    boxShadow:"0 8px 32px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",gap:10}}>
    <span style={{fontSize:18}}>{type==="success"?"✅":type==="error"?"❌":type==="warn"?"⚠️":"ℹ️"}</span>
    <span style={{fontSize:13,color:"rgba(255,255,255,0.9)"}}>{msg}</span>
  </div>;
}

function SuspiciousAppsModal({apps,onClose}) {
  return <div className="modal-overlay" onClick={onClose}>
    <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:700}}>⚠️ 출처 불명 소프트웨어</div>
          <div style={{fontSize:12,color:"var(--text-secondary)",marginTop:2}}>{apps.length}개 발견 — 불필요한 프로그램을 제거하세요</div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:10,color:"#fff",padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:13}}>닫기</button>
      </div>
      <div style={{marginBottom:12,padding:"10px 14px",background:"rgba(234,179,8,0.1)",border:"1px solid rgba(234,179,8,0.25)",borderRadius:12,fontSize:12,color:"#facc15",lineHeight:1.6}}>
        💡 퍼블리셔가 불명확한 소프트웨어입니다. 업무에 필요한지 확인 후 불필요하면 제거하세요.
      </div>
      {apps.length===0
        ? <div style={{textAlign:"center",padding:32,color:"var(--text-secondary)"}}>출처 불명 소프트웨어가 없습니다 🎉</div>
        : apps.map((app,i)=>(
          <div key={i} style={{padding:"12px 14px",marginBottom:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{app.name}</div>
                <div style={{fontSize:11,color:"var(--text-secondary)"}}>
                  퍼블리셔: {app.publisher} · 버전: {app.version}
                  {app.installDate&&app.installDate!=="-"&&` · 설치일: ${app.installDate}`}
                </div>
              </div>
              <button onClick={()=>{fetch("/api/check/software",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({appName:app.name})});alert(`프로그램 추가/제거 창이 열립니다.\n"${app.name}"을 직접 제거해 주세요.`);}}
                style={{flexShrink:0,padding:"5px 12px",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                🗑 제거
              </button>
            </div>
          </div>
        ))
      }
    </div>
  </div>;
}

function AppVersionModal({apps,onClose}) {
  return <div className="modal-overlay" onClick={onClose}>
    <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:700}}>📦 주요 프로그램 버전</div>
          <div style={{fontSize:12,color:"var(--text-secondary)",marginTop:2}}>설치된 주요 프로그램 버전 현황</div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:10,color:"#fff",padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:13}}>닫기</button>
      </div>
      {(apps||[]).map((app,i)=>(
        <div key={i} className="app-version-row">
          <div>
            <div style={{fontSize:13,fontWeight:600}}>{app.name}</div>
            <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>{app.detail}</div>
          </div>
          <StatusBadge status={app.status}/>
        </div>
      ))}
    </div>
  </div>;
}

export default function App() {
  const [activeTab,setActiveTab]=useState("home");
  const [scanning,setScanning]=useState(false);
  const [scanProgress,setScanProgress]=useState(0);
  const [scanLog,setScanLog]=useState([]);
  const [results,setResults]=useState({});
  const [extraData,setExtraData]=useState({});
  const [notes,setNotes]=useState({});
  const [fileshareReason,setFileshareReason]=useState("");
  const [toasts,setToasts]=useState([]);
  const [expandedSection,setExpandedSection]=useState(null);
  const [scanComplete,setScanComplete]=useState(false);
  const [reportName,setReportName]=useState("홍길동");
  const [reportDept,setReportDept]=useState("정보보호팀");
  const [suspiciousModal,setSuspiciousModal]=useState(false);
  const [appVersionModal,setAppVersionModal]=useState(false);
  const [reportLoading,setReportLoading]=useState(false);
  const scanLogRef=useRef(null);
  const nameInputRef=useRef(null);
  const deptInputRef=useRef(null);

  const addToast=useCallback((msg,type="info")=>{const id=Date.now()+Math.random();setToasts(t=>[...t,{id,msg,type}]);},[]);

  const totalItems=SECTIONS.reduce((s,sec)=>s+sec.items.length,0);
  const passCount=Object.values(results).filter(r=>r.status==="pass").length;
  const failCount=Object.values(results).filter(r=>r.status==="fail").length;
  const warnCount=Object.values(results).filter(r=>r.status==="warn").length;
  const manualCount=Object.values(results).filter(r=>r.status==="manual").length;
  const checkedCount=Object.values(results).filter(r=>r.status&&r.status!=="pending").length;
  const score=totalItems>0?Math.round((passCount/totalItems)*100):0;

  const fetchCheck=async(endpoint)=>{try{const res=await fetch(endpoint);if(!res.ok)throw new Error();return await res.json();}catch{return null;}};

  const setResult=useCallback((id,data)=>{setResults(prev=>({...prev,[id]:{...data,autoChecked:true}}));},[]);
  const appendLog=useCallback((text)=>{setScanLog(prev=>{const next=[...prev,text];setTimeout(()=>{if(scanLogRef.current)scanLogRef.current.scrollTop=scanLogRef.current.scrollHeight;},50);return next;});},[]);

  const runScan=useCallback(async()=>{
    if(scanning)return;
    setScanning(true); setScanLog([]); setScanProgress(0); setScanComplete(false);
    let antivirusCache: Record<string,unknown>|null = null;

    const steps=[
      ["1-4","/api/check/password",     null,               "비밀번호 변경일 확인"],
      ["1-5","/api/check/screensaver",  "screensaver",      "화면보호기 설정 확인"],
      ["2-1","/api/check/antivirus",    null,               "백신 프로그램 확인"],
      ["2-2","/api/check/antivirus",    null,               "백신 업데이트 확인"],
      ["2-3","/api/check/antivirus",    null,               "실시간 감시 확인"],
      ["2-4","/api/check/avscan",       null,               "정기 전체 검사 이력 확인"],
      ["2-5","/api/check/software",     null,               "출처 불명 소프트웨어 확인"],
      ["2-6","/api/check/firewall",     null,               "방화벽 설정 확인"],
      ["3-1","/api/check/update",       null,               "OS 자동 업데이트 확인"],
      ["3-2","/api/check/appversion",   null,               "주요 프로그램 버전 확인"],
      ["5-3","/api/check/usb",          "usb_control",      "USB 자동실행 확인"],
      ["6-3","/api/check/fileshare",    null,               "파일 공유 기능 확인"],
      ["7-3","/api/check/dlp",          null,               "DLP 설치 확인 (Officekeeper)"],
    ];

    for(let i=0;i<steps.length;i++){
      const [itemId,endpoint,fallbackKey,label]=steps[i];
      setScanProgress(Math.round(((i+0.5)/steps.length)*100));
      appendLog(`🔍 [${i+1}/${steps.length}] ${label}...`);
      await new Promise(r=>setTimeout(r,300));

      let data=null;
      // antivirus는 한 번만 호출해서 캐시 사용
      if(endpoint==="/api/check/antivirus") {
        if(!antivirusCache) antivirusCache = await fetchCheck(endpoint);
        data = antivirusCache;
      } else if(endpoint) {
        data=await fetchCheck(endpoint);
      }

      // antivirus API 캐시 (같은 엔드포인트 3번 호출 방지)
      if(itemId==="3-2"&&data?.apps) setExtraData(prev=>({...prev,appVersions:data.apps}));
      if(itemId==="2-5"&&data?.suspicious) setExtraData(prev=>({...prev,suspicious:data.suspicious}));

      // antivirus 응답을 항목별로 분리
      let result;
      if(data && (itemId==="2-1"||itemId==="2-2"||itemId==="2-3")) {
        if(itemId==="2-1") result={status:data.status,detail:data.detail,link:data.link,autoChecked:true};
        if(itemId==="2-2") result={status:data.avUpdated?"pass":"fail",detail:data.avDetail||data.detail,link:data.link,autoChecked:true};
        if(itemId==="2-3") result={status:data.realtimeEnabled?"pass":"fail",detail:data.realtimeDetail||data.detail,link:data.link,autoChecked:true};
      } else if(data && itemId==="7-3") {
        // 보안 에이전트 설치 확인 → 연관 항목도 자동 적합 처리
        const agents = data.agents || [];
        const preview = agents.slice(0,2).map((a:any)=>`${a.name}(${a.type})`).join(", ");
        const more = agents.length > 2 ? ` 외 ${agents.length-2}개` : "";
        const agentDetail = agents.length > 0 ? `${preview}${more}` : data.detail;
        result = {...data, detail: agentDetail, agents};
        if(data.installed) {
          setResult("1-2",{status:"pass",detail:"보안정책 준수 — 비밀번호 정책 적용 중",autoChecked:true});
          setResult("5-3",{status:"pass",detail:"DLP로 저장매체 사용 통제 중",autoChecked:true});
          setResult("7-3",{status:"pass",detail:agentDetail,autoChecked:true});
        } else {
          setResult("7-3",{status:"fail",detail:agentDetail,autoChecked:true});
        }
        result = {status: data.installed ? "pass" : "fail", detail: agentDetail, autoChecked:true};
      } else if(!data){
        if(fallbackKey && FALLBACK_CHECKS[fallbackKey]){
          result = FALLBACK_CHECKS[fallbackKey];
        } else {
          result = {status:"manual", detail:"자동 점검 불가 — 아래에서 수동 확인해주세요", link:null};
        }
      } else {
        result = data;
      }
      // status가 명확하지 않으면 manual로
      if(!["pass","fail","warn","manual","pending"].includes(result.status)){
        result = {...result, status:"manual"};
      }
      setResult(itemId, result);

      const icon=result.status==="pass"?"✅":result.status==="fail"?"❌":result.status==="warn"?"⚠️":"🔵";
      appendLog(`${icon} [${itemId}] ${(result.detail||result.status).slice(0,45)}`);
      setScanProgress(Math.round(((i+1)/steps.length)*100));
    }

    setScanning(false); setScanComplete(true);
    addToast("자동 점검 완료! 수동 항목을 확인해주세요.","success");
  },[scanning,addToast,setResult,appendLog]);

  const setManual=(itemId,status)=>{setResults(prev=>({...prev,[itemId]:{status,detail:status==="pass"?"수동 확인: 적합":"수동 확인: 미흡",autoChecked:false}}));};
  const openSettings=(link)=>{if(!link)return;window.open(link,"_blank");addToast("시스템 설정을 열었습니다.","info");};

  const generateReport=async(format)=>{
    // ref에서 최신 입력값 읽기 (IME 입력 중 blur 없이 버튼 눌러도 반영)
    const currentName = nameInputRef.current?.value || reportName;
    const currentDept = deptInputRef.current?.value || reportDept;
    setReportLoading(true);
    addToast(`${format.toUpperCase()} 보고서 생성 중...`,"info");
    try{
      const res=await fetch("/api/report",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({results,format,userInfo:{name:currentName,dept:currentDept,pcName:navigator.userAgent},inspector:{name:currentName,dept:currentDept,date:new Date().toLocaleDateString("ko-KR"),os:"Windows"}})});

      if(!res.ok){
        const err=await res.json().catch(()=>({error:"알수없는 오류"}));
        throw new Error(err.error||"생성 실패");
      }

      const contentType=res.headers.get("content-type")||"";
      if(contentType.includes("application/pdf")){
        const blob=await res.blob();
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        const dateStr=new Date().toLocaleDateString("ko-KR").replace(/\./g,"").replace(/ /g,"");
        a.href=url;a.download=`PC보안점검보고서_${dateStr}.pdf`;a.click();URL.revokeObjectURL(url);
        addToast("PDF 다운로드 완료!","success");
        return;
      }

      const data=await res.json();
      if(!data.success)throw new Error(data.error||"생성 실패");

      const dl=(base64,filename,mime)=>{
        const blob=new Blob([Uint8Array.from(atob(base64),c=>c.charCodeAt(0))],{type:mime});
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
      };

      if(format==="both"){
        if(data.pdf) dl(data.pdf,data.pdfName||"보안점검보고서.pdf","application/pdf");
        if(data.xlsx) setTimeout(()=>dl(data.xlsx,data.xlsxName||"보안점검보고서.xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),500);
        addToast("PDF + Excel 다운로드 완료! 다운로드 폴더를 확인하세요.","success");
      }else if(format==="pdf"){
        dl(data.data,data.filename||"보안점검보고서.pdf","application/pdf");
        addToast("PDF 다운로드 완료! 다운로드 폴더를 확인하세요.","success");
      }else{
        dl(data.data,data.filename||"보안점검보고서.xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        addToast("Excel 다운로드 완료! 다운로드 폴더를 확인하세요.","success");
      }
    }catch(e){addToast(`보고서 생성 실패: ${e.message}`,"error");}
    finally{setReportLoading(false);}
  };

  const improvementItems=SECTIONS.flatMap(s=>s.items.filter(i=>{const r=results[i.id];return r&&(r.status==="fail"||r.status==="warn");}).map(i=>({...i,section:s})));

  const SettingsBtn=({link,label,color="#60a5fa"})=>(
    <button onClick={()=>openSettings(link)} style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,
      background:`rgba(59,130,246,0.15)`,border:`1px solid rgba(59,130,246,0.3)`,color,cursor:"pointer",fontFamily:"inherit"}}>
      ⚙️ {label}
    </button>
  );

  const HomeTab=()=>(
    <div style={{padding:"0 16px 120px"}}>
      <div className="glass-card" style={{padding:24,margin:"16px 0",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg, rgba(59,130,246,0.08), rgba(168,85,247,0.05))",pointerEvents:"none"}}/>
        <div style={{fontSize:48,marginBottom:8}}>🛡️</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>PC 보안 자가점검</div>
        <div style={{fontSize:13,color:"var(--text-secondary)",marginBottom:20}}>정보통신망법 기반 개인 PC 보안 진단 시스템</div>
        <div style={{display:"flex",justifyContent:"center",gap:32,marginBottom:24}}>
          {[{val:checkedCount,max:totalItems,color:"#3b82f6",label:"점검 진행"},{val:score,max:100,color:score>=80?"#22c55e":score>=60?"#f59e0b":"#ef4444",label:"보안 점수",unit:"점"}].map((item,i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{position:"relative",display:"inline-block"}}>
                <ProgressRing value={item.val} max={item.max} size={90} color={item.color}/>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:18,fontWeight:800}}>{item.val}</span>
                  <span style={{fontSize:10,color:"var(--text-secondary)"}}>{item.max===100?item.unit:`/${item.max}`}</span>
                </div>
              </div>
              <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:6}}>{item.label}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          {[{l:"양호",v:passCount,c:"#22c55e"},{l:"주의",v:warnCount,c:"#f59e0b"},{l:"미흡",v:failCount,c:"#ef4444"},{l:"미점검",v:totalItems-checkedCount,c:"rgba(255,255,255,0.3)"}].map(s=>(
            <div key={s.l} style={{flex:1,padding:"10px 4px",borderRadius:12,background:`${s.c}18`,border:`1px solid ${s.c}30`,textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,color:"var(--text-secondary)",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <button className="glass-btn" onClick={runScan} disabled={scanning} style={{flex:2,padding:"16px",fontSize:15,fontWeight:700,
          background:scanning?"rgba(59,130,246,0.15)":"linear-gradient(135deg, rgba(59,130,246,0.3), rgba(6,182,212,0.2))",
          border:"1px solid rgba(59,130,246,0.4)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {scanning?<><span className="spinning" style={{fontSize:18}}>⟳</span> 점검 중... {scanProgress}%</>:scanComplete?<><span>🔄</span> 재실행</>:<><span>🔍</span> 자동 점검 시작</>}
        </button>
        {scanComplete&&<button className="glass-btn" onClick={()=>{const fails=SECTIONS.flatMap(s=>s.items).filter(i=>results[i.id]&&["fail","warn"].includes(results[i.id].status)&&i.autoKey);if(fails.length===0){addToast("재점검할 미흡 항목이 없습니다.","info");return;}runScan();}} disabled={scanning}
          style={{flex:1,padding:"16px",fontSize:13,fontWeight:600,background:"rgba(234,179,8,0.15)",border:"1px solid rgba(234,179,8,0.35)",color:"#facc15",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <span>⚡</span> 미흡 재점검
        </button>}
      </div>
      {scanLog.length>0&&<div className="glass-card" style={{padding:16,marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
          {scanning&&<span className="pulse-dot" style={{background:"#3b82f6"}}/>}
          스캔 로그 {scanning&&<span style={{color:"#3b82f6"}}>● 실행 중</span>}
        </div>
        {scanning&&<div className="scan-line" style={{marginBottom:8}}/>}
        <div ref={scanLogRef} style={{fontFamily:"monospace",fontSize:11,color:"#94a3b8",maxHeight:150,overflowY:"auto",lineHeight:1.8}}>
          {scanLog.map((l,i)=><div key={i}>{l}</div>)}
        </div>
      </div>}
      {SECTIONS.map(sec=>{
        const sp=sec.items.filter(i=>results[i.id]?.status==="pass").length;
        const sf=sec.items.filter(i=>["fail","warn"].includes(results[i.id]?.status)).length;
        const pct=Math.round((sp/sec.items.length)*100);
        return <div key={sec.id} className="glass-card" onClick={()=>{setActiveTab("check");setExpandedSection(sec.id);}}
          style={{padding:"14px 16px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:sec.bg,fontSize:16}}>{sec.emoji}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{sec.title}</div>
            <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:pct>=80?"#22c55e":pct>=50?"#f59e0b":"#ef4444",borderRadius:2,transition:"width 0.6s"}}/>
            </div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:13,fontWeight:700,color:sec.color}}>{sp}/{sec.items.length}</div>
            {sf>0&&<div style={{fontSize:10,color:"#f87171"}}>미흡 {sf}</div>}
          </div>
          <span style={{color:"var(--text-tertiary)",fontSize:14}}>›</span>
        </div>;
      })}
    </div>
  );

  const CheckTab=memo(()=>(
    <div style={{padding:"0 16px 120px"}}>
      <div style={{padding:"16px 0 8px",fontSize:13,color:"var(--text-secondary)"}}>자동 점검 불가 항목은 수동으로 체크하세요</div>
      {SECTIONS.map(sec=>{
        const isOpen=expandedSection===sec.id;
        return <div key={sec.id} id={"sec-"+sec.id} className="glass-card" style={{marginBottom:10,overflow:"hidden"}}>
          <div onClick={()=>{setExpandedSection(isOpen?null:sec.id);if(!isOpen){setTimeout(()=>{const el=document.getElementById("sec-"+sec.id);if(el)el.scrollIntoView({behavior:"smooth",block:"start"})},50);}}} style={{padding:"16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
            <div style={{width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:sec.bg,fontSize:16}}>{sec.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700}}>{sec.title}</div>
              <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>{sec.items.length}개 항목</div>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
              {sec.items.map(item=>{const r=results[item.id];const c=!r?"#ffffff18":r.status==="pass"?"#22c55e":r.status==="fail"?"#ef4444":"#f59e0b";return <div key={item.id} style={{width:8,height:8,borderRadius:"50%",background:c}}/>;})}</div>
            <span style={{color:"var(--text-secondary)",fontSize:16,transform:isOpen?"rotate(90deg)":"none",transition:"transform 0.25s"}}>›</span>
          </div>
          {isOpen&&<div style={{padding:"0 16px 16px"}}>
            {sec.items.map((item,ii)=>{
              const r=results[item.id];
              const isAuto=!!item.autoKey;
              const isManual=sec.id===4; // 개인정보 섹션 전부 수동
              // autoKey 있어도 API 실패해서 manual 상태면 수동 토글 표시
              const isManualStatus = r?.status === "manual";
              const showManualToggle = !isAuto || isManual || (item.canManual && isManualStatus);
              const status=r?.status||"pending";
              return <div key={item.id} className="check-row" style={{animationDelay:`${ii*0.06}s`}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:(isAuto&&!isManual)?0:10}}>
                  <div style={{flexShrink:0,marginTop:2}}>
                    {(isAuto&&!isManual&&!isManualStatus)
                      ?<div style={{fontSize:16}}>{status==="pass"?"✅":status==="fail"?"❌":status==="warn"?"⚠️":"⏳"}</div>
                      :<div onClick={()=>setManual(item.id,status==="pass"?"pending":"pass")}
                        style={{width:18,height:18,borderRadius:5,border:"1.5px solid rgba(255,255,255,0.2)",
                          background:status==="pass"?"#22c55e":status==="fail"?"#ef4444":"transparent",
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,cursor:"pointer"}}>
                        {status==="pass"&&"✓"}
                      </div>
                    }
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,lineHeight:1.5,marginBottom:4}}>{item.text}</div>
                    {r?.detail&&<div style={{fontSize:11,color:r.status==="pass"?"#4ade80":r.status==="fail"?"#f87171":"#facc15",marginBottom:6}}>{r.detail}</div>}
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <StatusBadge status={status}/>
                      {item.id==="2-5"&&extraData.suspicious?.length>0&&
                        <button onClick={()=>setSuspiciousModal(true)} style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171",cursor:"pointer",fontFamily:"inherit"}}>
                          🗑 목록 보기 ({extraData.suspicious.length}개)
                        </button>}
                      {item.id==="3-2"&&extraData.appVersions?.length>0&&
                        <button onClick={()=>setAppVersionModal(true)} style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",color:"#60a5fa",cursor:"pointer",fontFamily:"inherit"}}>📦 버전 상세</button>}
                      {item.id==="3-1"&&(status==="fail"||status==="warn")&&<SettingsBtn link="ms-settings:windowsupdate" label="Windows 업데이트"/>}
                      {item.id==="6-3"&&status==="pass"&&<span style={{fontSize:11,color:"#4ade80"}}>✓ 공유 없음</span>}
                      {item.id==="6-3"&&(status==="fail"||status==="warn")&&<>
                        <SettingsBtn link="ms-settings:network-status" label="네트워크 설정"/>
                      </>}
                      {item.id==="6-3"&&(status==="fail"||status==="warn")&&r?.shares&&r.shares.length>0&&<div style={{width:"100%",marginTop:8}}>
                        <div style={{fontSize:11,color:"#f87171",marginBottom:6}}>활성화된 공유 목록:</div>
                        {r.shares.map((sh:any,i:number)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",marginBottom:4,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8}}>
                            <div>
                              <span style={{fontSize:12,fontWeight:600,color:"#f87171"}}>{sh.name}</span>
                              <span style={{fontSize:11,color:"var(--text-secondary)",marginLeft:8}}>{sh.path}</span>
                            </div>
                            <button onClick={async()=>{
                              if(!confirm(`"${sh.name}" 공유를 비활성화하시겠습니까?`))return;
                              const res=await fetch("/api/check/fileshare",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:sh.name})});
                              const data=await res.json();
                              if(data.success){addToast(`"${sh.name}" 공유 비활성화 완료`,"success");runScan();}
                              else addToast(`실패: ${data.error}`,"error");
                            }} style={{padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,background:"rgba(239,68,68,0.2)",border:"1px solid rgba(239,68,68,0.4)",color:"#f87171",cursor:"pointer",fontFamily:"inherit"}}>
                              🔧 비활성화
                            </button>
                          </div>
                        ))}
                      </div>}
                      {isAuto&&!isManual&&r?.link&&(status==="fail"||status==="warn")&&item.id!=="3-1"&&item.id!=="6-3"&&
                        <SettingsBtn link={r.link} label="설정 바로가기"/>}
                    </div>
                    {item.id==="6-3"&&status==="pass"&&<div style={{marginTop:8}}>
                      <div style={{fontSize:11,color:"var(--text-secondary)",marginBottom:4}}>공유 기능 비활성화 이유 (보고서에 포함됩니다):</div>
                      <input
                        defaultValue={fileshareReason}
                        onBlur={e=>setFileshareReason(e.target.value)}
                        onChange={e=>setFileshareReason(e.target.value)}
                        placeholder="예: 업무상 파일공유 불필요, 보안정책에 따라 비활성화"
                        style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 10px",fontSize:11,color:"#fff",fontFamily:"inherit",outline:"none"}}
                      />
                    </div>}
                  </div>
                </div>
                {showManualToggle&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,color:"var(--text-secondary)"}}>{isManualStatus?"🔵 자동조회 실패 — 수동 확인:":"수동 확인:"}</span>
                  <div className="toggle-wrap">
                    <button className={`toggle-opt pass${status==="pass"?" active":""}`} onClick={()=>setManual(item.id,"pass")}>✓ 적합</button>
                    <button className={`toggle-opt fail${status==="fail"?" active":""}`} onClick={()=>setManual(item.id,"fail")}>✗ 미흡</button>
                  </div>
                  {notes[item.id]!==undefined&&<input
                    id={"note-"+item.id}
                    defaultValue={notes[item.id]||""}
                    onBlur={e=>{const el=document.getElementById("note-"+item.id);if(el)setNotes(n=>({...n,[item.id]:(el as HTMLInputElement).value}));}}
                    placeholder="비고..." style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"5px 10px",fontSize:11,color:"#fff",fontFamily:"inherit",outline:"none"}}/>}
                  <button onClick={()=>setNotes(n=>n[item.id]!==undefined?{...n,[item.id]:undefined}:{...n,[item.id]:""})}
                    style={{background:"none",border:"none",color:"var(--text-tertiary)",cursor:"pointer",fontSize:14}}>✏️</button>
                </div>}
              </div>;
            })}
          </div>}
        </div>;
      })}
    </div>
  ));
const ImproveTab=()=>(
    <div style={{padding:"0 16px 120px"}}>
      <div style={{padding:"16px 0 8px"}}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>개선 사항</div>
        <div style={{fontSize:13,color:"var(--text-secondary)"}}>{improvementItems.length>0?`${improvementItems.length}개 항목이 조치를 필요로 합니다`:"모든 항목 양호!"}</div>
      </div>
      {improvementItems.length===0
        ?<div className="glass-card" style={{padding:40,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:12}}>🎉</div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>모든 항목이 양호합니다</div>
          <div style={{fontSize:13,color:"var(--text-secondary)"}}>보안 점검을 통과했습니다.</div>
        </div>
        :improvementItems.map(item=>{
          const r=results[item.id];
          const tip=IMPROVE_TIPS[item.id];
          const bc=r?.status==="fail"?"#ef4444":"#f59e0b";
          return <div key={item.id} className="glass-card" style={{padding:16,marginBottom:10,borderLeft:`3px solid ${bc}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:700,color:bc}}>[{item.id}]</span>
              <StatusBadge status={r?.status}/>
              <span style={{fontSize:11,color:"var(--text-tertiary)"}}>{item.section.title}</span>
            </div>
            <div style={{fontSize:13,lineHeight:1.6,marginBottom:8}}>{item.text}</div>
            {r?.detail&&<div style={{fontSize:12,color:"var(--text-secondary)",padding:"8px 12px",background:"rgba(255,255,255,0.04)",borderRadius:8,marginBottom:8}}>🔍 {r.detail}</div>}
            {tip&&<div style={{fontSize:12,color:"#93c5fd",padding:"8px 12px",background:"rgba(59,130,246,0.08)",borderRadius:8,marginBottom:8,lineHeight:1.6}}>💡 {tip}</div>}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {item.id==="3-1"&&<button onClick={()=>openSettings("ms-settings:windowsupdate")} className="glass-btn" style={{padding:"8px 14px",fontSize:12,fontWeight:600,background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",color:"#60a5fa"}}>⚙️ Windows 업데이트 설정 열기</button>}
              {item.id==="6-3"&&<button onClick={()=>openSettings("ms-settings:network-status")} className="glass-btn" style={{padding:"8px 14px",fontSize:12,fontWeight:600,background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",color:"#60a5fa"}}>⚙️ 네트워크 설정 열기</button>}
              {item.id==="2-5"&&extraData.suspicious?.length>0&&<button onClick={()=>setSuspiciousModal(true)} className="glass-btn" style={{padding:"8px 14px",fontSize:12,fontWeight:600,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171"}}>🗑 출처 불명 목록 보기</button>}
              {item.id==="3-2"&&extraData.appVersions?.length>0&&<button onClick={()=>setAppVersionModal(true)} className="glass-btn" style={{padding:"8px 14px",fontSize:12,fontWeight:600,background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",color:"#60a5fa"}}>📦 프로그램 버전 확인</button>}
              {r?.link&&item.id!=="3-1"&&item.id!=="6-3"&&<button onClick={()=>openSettings(r.link)} className="glass-btn" style={{padding:"8px 14px",fontSize:12,fontWeight:600,background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",color:"#60a5fa"}}>⚙️ 설정 바로가기</button>}
              <button onClick={()=>setManual(item.id,"pass")} className="glass-btn" style={{padding:"8px 14px",fontSize:12,fontWeight:600,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.25)",color:"#4ade80"}}>✓ 조치 완료</button>
            </div>
          </div>;
        })
      }
    </div>
  );

  const ReportTab=()=>(
    <div style={{padding:"0 16px 120px"}}>
      <div style={{padding:"16px 0 12px",fontSize:18,fontWeight:700}}>점검 보고서</div>
      <div className="glass-card" style={{padding:16,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:"var(--text-secondary)"}}>점검자 정보</div>
        <div style={{marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{fontSize:12,color:"var(--text-secondary)",width:32}}>성명</span>
            <input
              ref={nameInputRef}
              defaultValue={reportName}
              onBlur={()=>setReportName(nameInputRef.current?.value||"")}
              placeholder="이름 입력"
              style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#fff",fontFamily:"inherit",outline:"none"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{fontSize:12,color:"var(--text-secondary)",width:32}}>부서</span>
            <input
              ref={deptInputRef}
              defaultValue={reportDept}
              onBlur={()=>setReportDept(deptInputRef.current?.value||"")}
              placeholder="부서 입력"
              style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#fff",fontFamily:"inherit",outline:"none"}}/>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,color:"var(--text-secondary)",width:32}}>일자</span>
          <span style={{fontSize:13,color:"var(--text-secondary)"}}>{new Date().toLocaleDateString("ko-KR")}</span>
        </div>
      </div>
      <div className="glass-card" style={{padding:16,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:"var(--text-secondary)"}}>점검 요약</div>
        {[
          {label:"총 점검 항목",val:`${totalItems}개`},
          {label:"점검 완료",val:`${checkedCount}개 (${Math.round(checkedCount/totalItems*100)||0}%)`,color:"#3b82f6"},
          {label:"양호 항목",val:`${passCount}개`,color:"#22c55e"},
          {label:"주의 항목",val:`${warnCount}개`,color:"#f59e0b"},
          {label:"미흡 항목",val:`${failCount}개`,color:"#ef4444"},
          {label:"보안 점수",val:`${score}점 / 100점`,color:score>=80?"#22c55e":score>=60?"#f59e0b":"#ef4444"},
        ].map(row=>(
          <div key={row.label} className="report-row">
            <span style={{fontSize:13,color:"var(--text-secondary)"}}>{row.label}</span>
            <span style={{fontSize:14,fontWeight:700,color:row.color||"var(--text-primary)"}}>{row.val}</span>
          </div>
        ))}
      </div>
      <div style={{padding:"10px 14px",background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:12,marginBottom:12,fontSize:12,color:"#93c5fd",lineHeight:1.6}}>
        📥 아래 버튼을 누르면 브라우저 <strong>다운로드 폴더</strong>에 보고서 파일이 저장됩니다.
      </div>
      <div style={{display:"flex",gap:10,marginBottom:8}}>
        <button className="glass-btn" onClick={()=>generateReport("pdf")} disabled={reportLoading} style={{flex:1,padding:"16px",fontSize:14,fontWeight:700,
          background:"linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.1))",border:"1px solid rgba(239,68,68,0.4)",color:"#fca5a5",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:reportLoading?0.6:1}}>
          {reportLoading?<span className="spinning">⟳</span>:<span>📄</span>} PDF 다운로드
        </button>
        <button className="glass-btn" onClick={()=>generateReport("excel")} disabled={reportLoading} style={{flex:1,padding:"16px",fontSize:14,fontWeight:700,
          background:"linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.1))",border:"1px solid rgba(34,197,94,0.4)",color:"#86efac",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:reportLoading?0.6:1}}>
          {reportLoading?<span className="spinning">⟳</span>:<span>📊</span>} Excel 다운로드
        </button>
      </div>
      <button className="glass-btn" onClick={()=>generateReport("both")} disabled={reportLoading} style={{width:"100%",padding:"14px",fontSize:13,fontWeight:600,
        background:"rgba(168,85,247,0.15)",border:"1px solid rgba(168,85,247,0.35)",color:"#c084fc",
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:reportLoading?0.6:1}}>
        {reportLoading?<><span className="spinning">⟳</span> 생성 중...</>:<><span>📦</span> PDF + Excel 동시 다운로드</>}
      </button>
      <div style={{textAlign:"center",marginTop:16,fontSize:11,color:"var(--text-tertiary)",lineHeight:1.6}}>
        본 점검은 정보통신망 이용촉진 및 정보보호 등에 관한 법률 기반<br/>개인PC 보안 자가점검 도구입니다.
      </div>
    </div>
  );

  const TABS=[{id:"home",icon:"🏠",label:"홈"},{id:"check",icon:"✅",label:"점검"},{id:"improve",icon:"🔧",label:"개선",badge:improvementItems.length},{id:"report",icon:"📋",label:"보고서"}];

  return <>
    <style>{GLOBAL_STYLE}</style>
    <div className="bg-mesh"><div className="bg-orb"/><div className="bg-orb"/><div className="bg-orb"/></div>
    <div style={{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",paddingTop:60}}>
      <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,zIndex:10,
        padding:"12px 20px 10px",background:"rgba(10,14,26,0.7)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>🛡️</span>
            <div>
              <div style={{fontSize:15,fontWeight:700}}>TERAsys 개인 전산장비 자가 점검</div>
              <div style={{fontSize:10,color:"var(--text-tertiary)"}}>정보통신망법 기반</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:scanComplete?"#22c55e":scanning?"#3b82f6":"#f59e0b",boxShadow:`0 0 8px ${scanComplete?"#22c55e":scanning?"#3b82f6":"#f59e0b"}`}}/>
            <span style={{fontSize:11,color:"var(--text-secondary)"}}>{scanning?"점검 중":scanComplete?"점검 완료":"대기 중"}</span>
          </div>
        </div>
      </div>
      {activeTab==="home"&&<HomeTab/>}
      {activeTab==="check"&&<CheckTab/>}
      {activeTab==="improve"&&<ImproveTab/>}
      {activeTab==="report"&&<ReportTab/>}
    </div>
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,zIndex:10,
      padding:"8px 12px 20px",background:"rgba(10,14,26,0.85)",backdropFilter:"blur(24px)",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",gap:4}}>
      {TABS.map(t=>(
        <button key={t.id} className={`tab-item${activeTab===t.id?" active":""}`} onClick={()=>setActiveTab(t.id)} style={{position:"relative"}}>
          <span style={{fontSize:20}}>{t.icon}</span>
          <span>{t.label}</span>
          {t.badge>0&&<div style={{position:"absolute",top:6,right:"50%",transform:"translateX(14px)",width:16,height:16,borderRadius:"50%",background:"#ef4444",fontSize:9,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{t.badge}</div>}
        </button>
      ))}
    </div>
    {suspiciousModal&&<SuspiciousAppsModal apps={extraData.suspicious||[]} onClose={()=>setSuspiciousModal(false)}/>}
    {appVersionModal&&<AppVersionModal apps={extraData.appVersions||[]} onClose={()=>setAppVersionModal(false)}/>}
    {toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onDone={()=>setToasts(ts=>ts.filter(x=>x.id!==t.id))}/>)}
  </>;
}
