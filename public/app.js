const RC={latestUrl:"/assets/ai-sandbox/runtime-c-runs/latest.json",pollMs:2500,currentRun:null,mode:"stream",acceptedRunId:null,runStartedAt:null,runs:[]};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const bad=new Set(["demo","runtime-c-ui-submit-test"]);
const laneFiles={WA:"output/index.html",WB:"output/styles.css",WC:"output/app.js",WD:"output/CLASS_MANIFEST.json",WE:"output/REGRESSION_PROOF.md",WF:"output/OPERATOR_REVIEW_CARD.md"};
const stamp=r=>String(r?.run_id||"").match(/\d{8}T\d{6}Z/i)?.[0]||"--";
const short=r=>String(r?.product_slug||r?.job_id||r?.run_id||"runtime-c").replace(/^REAL_UI_/,"").replace(/-\d{8}T\d{6}Z$/i,"").slice(0,34);
const asset=(r,f)=>r?.run_id?`/assets/ai-sandbox/runtime-c-runs/${r.run_id}/${f}`:"#";
function runUrl(r,f){return asset(r,f)}
function elapsed(r){return r?.total_duration_ms?fmtMs(r.total_duration_ms):(RC.runStartedAt?fmtMs(Date.now()-RC.runStartedAt):"0:00");}
function fmtMs(ms){ms=Number(ms||0);const sec=Math.round(ms/1000);const m=Math.floor(sec/60);const s=String(sec%60).padStart(2,"0");return `${m}:${s}`;}
async function jj(u,f=null){try{const r=await fetch(u+"?x="+Date.now(),{cache:"no-store"});return r.ok?await r.json():f}catch{return f}}
async function tt(u,f=""){try{const r=await fetch(u+"?x="+Date.now(),{cache:"no-store"});return r.ok?await r.text():f}catch{return f}}
function real(r){return r&&r.run_id}
function pipe(label){$$(".pipeline button").forEach(b=>b.classList.toggle("active",b.textContent.trim()===label));}
function queueCard(){const q=$(".queue");if(q)q.innerHTML='<div class="panel-title split"><span>RUN QUEUE</span><span class="pod-tabs"><b class="pod-a">A</b><b class="pod-b">B</b><b class="pod-c">C</b></span></div><div class="queue-group"><div class="queue-head pod-a">READY</div><article class="job-card queued"><b>No queued Runtime C jobs</b><span>submit accepted jobs appear here</span></article></div>';}
function idle(){pipe("SUBMIT");const c=$(".current-build");if(c){$("strong",c).textContent="ready";$("span",c).textContent="no active submitted job";}$$(".lane-card").forEach(card=>{card.className="lane-card";$("em",card).innerHTML="<i>ready</i><i>WAIT</i>";$(".lane-metrics",card).innerHTML="<small>chars 0</small><small>lines 0</small><small>READY</small>";$(".bar i",card).style.width="12%";});$$(".mini-card").forEach(card=>{$("em",card).innerHTML="<i>ready</i><i>--:--</i>";$(".bar i",card).style.width="12%";});$(".watch-box pre").textContent="READY\nNo active submitted job.";$(".observer-wide").innerHTML='<div class="panel-title">OPERATOR FEED</div><div class="observer-line">Runtime C ready</div><div class="observer-line">Pipeline idle</div>';}
function recent(runs){const p=$(".recent");if(!p)return;p.innerHTML='<div class="panel-title">REAL JOBS</div>';runs.filter(real).slice(0,12).forEach(r=>{const e=document.createElement("article");e.className=`job-card ${r.status==="PASS"?"pass":"queued"}`;e.innerHTML=`<b><span class="pod-a">${r.pod||"A"}</span> ${short(r)} <a href="${runUrl(r,"output/index.html")}" target="_blank" title="UI artifact">↗ UI</a> <button class="copy-run" data-run="${r.run_id}">COPY</button></b><span>${r.status} · ${fmtMs(r.total_duration_ms||0)} · <a href="${runUrl(r,"TPS_REPORT.md")}" target="_blank">TPS</a> <button class="copy-tps" data-run="${r.run_id}">COPY TPS</button></span>`;e.onclick=(ev)=>{if(ev.target.classList.contains("copy-run")||ev.target.classList.contains("copy-tps"))return;select(r);};p.appendChild(e);});
  $$(".copy-run",p).forEach(btn=>btn.onclick=async(ev)=>{
    ev.stopPropagation();
    const r=RC.runs?.find?.(x=>x.run_id===btn.dataset.run)||null;
    const txt=r?[
      `run_id=${r.run_id}`,
      `product=${r.product_slug}`,
      `status=${r.status}`,
      `state=${r.state}`,
      `pod=${r.pod||"A"}`,
      `total_time=${fmtMs(r.total_duration_ms||0)}`,
      `ui=${runUrl(r,"output/index.html")}`,
      `tps=${runUrl(r,"TPS_REPORT.md")}`
    ].join("\n"):"missing run";
    await navigator.clipboard.writeText(txt);
    btn.textContent="COPIED";
    setTimeout(()=>btn.textContent="COPY",900);
  });
  $$(".copy-tps",p).forEach(btn=>btn.onclick=async(ev)=>{
    ev.stopPropagation();
    const run=btn.dataset.run;
    const txt=await tt(`/assets/ai-sandbox/runtime-c-runs/${run}/TPS_REPORT.md`,"TPS missing");
    await navigator.clipboard.writeText(txt);
    btn.textContent="COPIED";
    setTimeout(()=>btn.textContent="COPY TPS",900);
  });
}
async function fileStats(r,file){const txt=await tt(asset(r,file),null);if(txt==null)return{chars:0,lines:0};return{chars:txt.length,lines:txt.split(/\n/).length};}

async function laneProgressFromEvents(r){
  const ev = await tt(asset(r,"EVENT_LOG.jsonl"),"");
  const lanes = ["WA","WB","WC","WD","WE","WF"];
  const out = {};
  for (const l of lanes) out[l] = {status:"WAIT", bytes:0, duration_ms:0};
  for (const line of ev.split(/\n+/)) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      const l = e.lane || (String(e.phase||"").startsWith("WA") ? "WA" : "");
      if (!out[l]) continue;
      if (e.event === "LANE_START" || e.event === "PHASE_START") out[l].status = "ACTIVE";
      if (e.event === "LANE_DONE" || e.event === "PHASE_DONE") out[l].status = e.status || "PASS";
    } catch {}
  }
  return out;
}

async function lanes(r){
  
const tele=await jj(asset(r,"LANE_TELEMETRY.json"),{lanes:[]});
const evLane = await laneProgressFromEvents(r);
const by=Object.fromEntries(
  (tele.lanes||[]).map(x=>[x.lane,x])
);

  const stats=r.lane_artifacts||{};
  for(const card of $$(".lane-card")){
    const l=$("span",card)?.textContent?.trim();
    const d={...(evLane[l]||{}),...(by[l]||{})};
    const st=d;
const bytes=Object.values(d.artifact_bytes||{})
.reduce((a,b)=>a+Number(b||0),0);

    $("em",card).innerHTML=`<i>${d.last_event||"ready"}</i><i>${d.status||st.status||"READY"}</i>`;
    $(".lane-metrics",card).innerHTML=`<small>${bytes} bytes</small><small>${st.status||"WAIT"}</small><small>${fmtMs(st.duration_ms||0)}</small>`;
    $(".bar i",card).style.width=(d.status==="PASS"||st.status==="PASS")?"100%":"12%";
  }
}
function coreReady(){$$(".mini-card").forEach(card=>{$("em",card).innerHTML="<i>ready</i><i>--:--</i>";$(".bar i",card).style.width="12%";});}
async function select(r){RC.currentRun=r;pipe(r.status==="PASS"?"DEPLOY":"LANES");const c=$(".current-build");if(c){$("strong",c).textContent=short(r);$("span",c).textContent=`${stamp(r)} · pod ${r.pod||"A"} · ${r.state||r.status} · ${elapsed(r)}`;}await lanes(r);coreReady();await feed(r);mode(r);}
async function feed(r){const tele=await jj(asset(r,"LANE_TELEMETRY.json"),{lanes:[]});$(".observer-wide").innerHTML='<div class="panel-title">OPERATOR FEED</div>'+[`loaded ${short(r)}`,`state: ${r.state||r.status}`,`stream: telemetry_live`,`lanes: ${Object.values(await laneProgressFromEvents(r)).filter(x=>!["WAIT","IDLE","READY",null].includes(x.status)).length}/6`,`total time: ${fmtMs(r.total_duration_ms||0)}`,`pod ${r.pod||"A"} active`].map(x=>`<div class="observer-line">${x}</div>`).join("");}
async function mode(r=RC.currentRun){if(!r)return;const box=$(".watch-box"),pre=$(".watch-box pre");box.style.position="relative";let b=$(".copy-watch",box);if(!b){b=document.createElement("button");b.className="copy-watch";b.textContent="⧉";b.style.cssText="position:absolute;right:12px;top:12px;z-index:9";b.onclick=()=>navigator.clipboard.writeText(pre.textContent||"");box.appendChild(b);}if(RC.mode==="tps"){let x=await tt(asset(r,"TPS_REPORT.md"),"TPS missing");pre.textContent=x.startsWith("<!doctype")?"TPS missing / route fallback returned HTML":x;}else if(RC.mode==="eila")pre.textContent=JSON.stringify(await jj(asset(r,"RUN_STATE.json"),r),null,2);else{const ev=await tt(asset(r,"EVENT_LOG.jsonl"),"");const fail=await tt(asset(r,"FAILURE_CATALOG.jsonl"),"");const err=await tt(asset(r,"ISLAND_STDERR.log"),"");pre.textContent=[ev,fail,err].filter(Boolean).join("\n---\n")||"waiting for live process logs...";}}
async function refresh(){const latest=await jj(RC.latestUrl,{runs:[]});const runs=latest.runs||[];RC.runs=runs;recent(runs);if(RC.acceptedRunId){let r=runs.find(x=>x.run_id===RC.acceptedRunId);if(!r){const st=await jj(`/assets/ai-sandbox/runtime-c-runs/${RC.acceptedRunId}/RUN_STATE.json`,null);r=st?{run_id:RC.acceptedRunId,product_slug:RC.acceptedRunId.replace(/-\d{8}T\d{6}Z$/,""),status:st.status||"ACTIVE",state:st.state||st.status||"ACTIVE",pod:st.pod||"A",stream_lanes:[],lane_artifacts:{},lane_durations_ms:{},total_duration_ms:0}:null;}if(r)return select(r);$(".observer-wide").innerHTML=`<div class="panel-title">OPERATOR FEED</div><div class="observer-line">WAITING FOR RUN FILES · ${RC.acceptedRunId}</div>`+$(".observer-wide").innerHTML;return;}if(!RC.currentRun)idle();}
async function submit(){


  const ta=$(".intake textarea"), feed=$(".observer-wide");
  const log=m=>{ const line=`${new Date().toLocaleTimeString()} · ${m}`; if(feed) feed.innerHTML=`<div class="panel-title">OPERATOR FEED</div><div class="observer-line">${line}</div>`+feed.innerHTML; console.log("[runtime-c-submit]",m); };
 const prompt = ta.value.trim();

if (!prompt) {
  log("SUBMIT REJECTED · empty build request");
  return;
}

const payload = {
  prompt
};

  pipe("QUEUE");
  log("SUBMIT CLICKED · sending buildsheet");
  let res,d;
  try{
    res=await fetch("/runtime-c-submit/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
    d=await res.json();
  }catch(e){
    log("SUBMIT FAILED · network/client error · "+e.message);
    return;
  }

  log(`SUBMIT RESPONSE · http ${res.status} · ${d.ok?"ACCEPTED":"REJECTED"}`);
  if(!d.ok){
    const det=d.details||{}, vf=d.valid_format||{};
    const allowed=Array.isArray(det.allowed)?det.allowed.join(", "):JSON.stringify(det.allowed||"");
    if(feed) feed.innerHTML=`<div class="panel-title">OPERATOR FEED</div><div class="observer-line"><b>INPUT VALIDATION FAILED</b></div><div class="observer-line">code: ${d.code||d.error||"INVALID_INPUT"}</div><div class="observer-line">provided: ${det.provided??""}</div><div class="observer-line">allowed: ${allowed}</div><div class="observer-line">suggested fix: Use iteration_pass</div>`;
    console.warn("[runtime-c-submit-invalid]",d);
    return;
  }

  RC.acceptedRunId=String(d.root||"").split("/").pop();RC.runStartedAt=Date.now();
  log("RUN ACCEPTED · "+RC.acceptedRunId);
  const optimistic={run_id:RC.acceptedRunId,product_slug:RC.acceptedRunId.replace(/-\d{8}T\d{6}Z$/,""),status:"ACTIVE",state:"SUBMITTED",pod:"A",stream_lanes:[],lane_artifacts:{},lane_durations_ms:{},total_duration_ms:0};
  RC.runs=[optimistic,...(RC.runs||[]).filter(x=>x.run_id!==RC.acceptedRunId)];
  recent(RC.runs); select(optimistic);
  ta.value="";
  pipe("LANES");
  setTimeout(refresh,300);
  setTimeout(refresh,1200);
}
function boot(){queueCard();idle();$(".icon-row .primary")?.addEventListener("click",submit);$$(".mode-buttons button").forEach(b=>b.onclick=()=>{RC.mode=b.textContent.trim().toLowerCase().includes("tps")?"tps":b.textContent.trim().toLowerCase().includes("eila")?"eila":"stream";$$(".mode-buttons button").forEach(x=>x.classList.remove("active"));b.classList.add("active");mode();});refresh();setInterval(refresh,RC.pollMs);}
boot();

/* runtime-c live timer patch */
function rtcRunStartMs(r){
  const t=r.created_at||r.updated_at||"";
  if(t) return Date.parse(t);
  const m=String(r.run_id||"").match(/(\d{8})T(\d{6})Z$/);
  return m?Date.parse(`${m[1].slice(0,4)}-${m[1].slice(4,6)}-${m[1].slice(6,8)}T${m[2].slice(0,2)}:${m[2].slice(2,4)}:${m[2].slice(4,6)}Z`):Date.now();
}
function rtcDur(ms){ms=Math.max(0,Math.floor(ms/1000));return `${Math.floor(ms/60)}:${String(ms%60).padStart(2,"0")}`;}
async function rtcLiveTimers(){
  try{
    const j=await fetch("/assets/ai-sandbox/runtime-c-runs/latest.json?x="+Date.now(),{cache:"no-store"}).then(r=>r.json());
    (j.runs||[]).forEach(r=>{if(String(r.status)==="ACTIVE") r.total_duration_ms=Date.now()-rtcRunStartMs(r);});
    if(typeof recent==="function") recent(j.runs||[]);
    if(typeof select==="function" && (j.runs||[])[0]) select((j.runs||[])[0]);
  }catch(e){}
}
setInterval(rtcLiveTimers,2000); rtcLiveTimers();
