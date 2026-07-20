const latestUrl = "/assets/ai-sandbox/runtime-c-runs/latest.json";

function runId(r){
  return r.run_id || (r.root ? r.root.split("/").pop() : "") || r.product_slug || r.job_name || "unknown";
}

function label(r){
  return r.product_slug || r.job_name || runId(r);
}

async function getLatest(){
  const res = await fetch(latestUrl + "?t=" + Date.now(), {cache:"no-store"});
  if(!res.ok) throw new Error("latest_" + res.status);
  const data = await res.json();
  return Array.isArray(data.runs) ? data.runs : [];
}

function paintRunQueue(runs){
  const host = document.querySelector('[data-mount="runQueue"] .panel');
  if(!host) return;

  const queued = runs.filter(r =>
    String(r.state || "").includes("WAITING") ||
    String(r.status || "").includes("QUEUED") ||
    String(r.state || "").includes("QUEUED")
  );

  host.innerHTML = `
    <div class="panel-title">RUN QUEUE <span style="float:right;color:var(--green)">A B C</span></div>
    <h2 style="color:var(--green)">${queued.length ? "QUEUED" : "READY"}</h2>
    ${queued.length ? queued.map(r => `
      <div class="card">
        <strong>${label(r)}</strong>
        <div class="small">${r.state || r.status || "QUEUED"} · POD ${r.pod || "A"}</div>
      </div>
    `).join("") : `
      <div class="card">
        <strong>No queued Runtime C jobs</strong>
        <div class="small">submitted accepted jobs appear here</div>
      </div>
    `}
  `;
}

function paintRealJobs(runs){
  const host = document.querySelector('[data-mount="realJobs"] .panel');
  if(!host) return;

  const active = runs.filter(r =>
    String(r.status || "").toUpperCase() === "ACTIVE" &&
    String(r.state || "").toUpperCase() === "RUNNING"
  ).slice(0,8);

  host.innerHTML = `
    <div class="panel-title">REAL JOBS</div>
    ${active.length ? active.map(r => `
      <div class="card">
        <strong>${label(r)}</strong>
        <div class="small">${r.status || "ACTIVE"} · ${r.state || "RUNNING"} · POD ${r.pod || "A"}</div>
      </div>
    `).join("") : `
      <div class="card">
        <strong>No active Runtime C jobs</strong>
        <div class="small">live jobs appear here</div>
      </div>
    `}
  `;
}

function paintFeed(runs){
  const host = document.querySelector('[data-mount="eilaOs"] .panel');
  if(!host) return;

  const top = runs[0];
  host.innerHTML = `
    <div class="panel-title">OPERATOR FEED</div>
    <pre style="color:var(--green);white-space:pre-wrap;margin:0">${
      top
      ? `loaded ${runId(top)}
state: ${top.state || "RUNNING"}
status: ${top.status || "ACTIVE"}
pod: ${top.pod || "A"}
runtime-c submit live
latest.json connected`
      : `Runtime C ready
Pipeline idle`
    }</pre>
  `;
}

function paintPipeline(runs){
  const top = runs[0];
  const state = top ? (top.state || top.status || "running").toLowerCase() : "ready";
  document.querySelectorAll('[data-mount="runtimePipeline"] .card .small').forEach(el => {
    el.textContent = state;
  });
}

async function tick(){
  try{
    const runs = await getLatest();
    paintRunQueue(runs);
    paintRealJobs(runs);
    paintFeed(runs);
    paintPipeline(runs);
  }catch(err){
    paintFeed([]);
    console.warn("[runtime-c-live]", err);
  }
}

export function initLivePanels(){
  tick();
  setInterval(tick, 2500);
  window.addEventListener("runtime-c:submitted", () => setTimeout(tick, 600));
}
