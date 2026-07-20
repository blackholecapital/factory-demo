function inside(root, sel){ return root.querySelector(sel); }

function uniqueJobNames(data){
  const runs = Array.isArray(data?.runs) ? data.runs : [];
  return [...new Set(runs.map(r => r.product_slug || r.job_name || r.title).filter(Boolean))];
}

function setStatus(root, message, kind=''){
  const el = inside(root, '.br-status');
  if(!el) return;
  el.className = `br-status ${kind ? `br-${kind}` : ''}`;
  el.textContent = message || '';
}

async function loadImprovableJobs(root, manifest){
  const select = inside(root, '.br-job-select');
  try{
    const res = await fetch(manifest.services.latestRuns, {cache:'no-store'});
    if(!res.ok) throw new Error(`latest_runs_${res.status}`);
    const names = uniqueJobNames(await res.json());
    select.innerHTML = names.length
      ? names.map(n => `<option value="${String(n).replaceAll('"','&quot;')}">${n}</option>`).join('')
      : '<option value="">No improvable jobs found</option>';
  }catch(err){
    select.innerHTML = '<option value="">No improvable jobs found</option>';
    console.warn('[runtime-c-build] latest runs unavailable', err);
  }
}

function setMode(root, improve){
  const btn = inside(root, '.br-mode-toggle');
  const jobName = inside(root, '.br-job-name');
  const jobSelect = inside(root, '.br-job-select');
  const submit = inside(root, '.br-submit-btn');

  btn.dataset.mode = improve ? 'iteration_pass' : 'initial_build';
  btn.textContent = improve ? 'Improve' : 'Build';
  btn.classList.toggle('br-improve', improve);
  jobName.hidden = improve;
  jobSelect.hidden = !improve;
  submit.textContent = improve ? 'Improve' : 'Build';
  setStatus(root, improve ? 'Improve mode requires an existing job selection.' : '');
}

function buildPayload(root){
  const mode = inside(root, '.br-mode-toggle').dataset.mode || 'initial_build';
  const pod = inside(root, '.br-pod-select').value || 'A';
  const name = mode === 'iteration_pass'
    ? inside(root, '.br-job-select').value
    : inside(root, '.br-job-name').value.trim();
  const objective = inside(root, '.br-objective').value.trim();

  if(!name) throw new Error(mode === 'iteration_pass' ? 'Select an existing job first.' : 'Enter a job name.');
  if(!objective) throw new Error('Describe the build request first.');

  return {
    schema:'runtime-c.v2',
    mode,
    pass: mode === 'iteration_pass' ? 2 : 1,
    objective,
    job_name:name,
    title:name,
    pod,
    lane_cell_backend:pod
  };
}

async function submitBuild(root, manifest){
  const submit = inside(root, '.br-submit-btn');
  const rocket = inside(root, '.br-rocket-btn');
  let payload;

  try{
    payload = buildPayload(root);
  }catch(err){
    setStatus(root, err.message, 'error');
    return;
  }

  submit.disabled = true;
  rocket.disabled = true;
  setStatus(root, `Submitting ${payload.mode} for ${payload.job_name} on Pod ${payload.pod}...`);

  try{
    const res = await fetch(manifest.services.submit, {
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify(payload)
    });

    const data = await res.json().catch(()=>({ok:false,error:`non_json_response_${res.status}`}));
    console.log('[runtime-c-submit]', {status:res.status, payload, response:data});

    if(!res.ok || data.ok === false){
      throw new Error(data.error || `submit_http_${res.status}`);
    }

    const runId = data.run_id || data.id || data.product_slug || payload.job_name;
    setStatus(root, `Submitted: ${runId}`, 'ok');
    window.dispatchEvent(new CustomEvent('runtime-c:submitted', {detail:{payload,response:data}}));
  }catch(err){
    setStatus(root, `Submit failed: ${err.message}`, 'error');
  }finally{
    submit.disabled = false;
    rocket.disabled = false;
  }
}

function photoInput(){
  let input = document.querySelector('.br-photo-input');
  if(!input){
    input = document.createElement('input');
    input.type='file';
    input.accept='image/*';
    input.className='br-photo-input';
    input.hidden=true;
    document.body.appendChild(input);
  }
  input.click();
}

export function initBuildPanel(manifest){
  const root = document.querySelector('[data-section="build-request"]');
  if(!root) return;

  const pod = inside(root, '.br-pod-select');
  pod.innerHTML = manifest.pods.map(p => `<option value="${p.id}">${p.label} · ${p.coder}</option>`).join('');

  setMode(root, false);
  loadImprovableJobs(root, manifest);

  inside(root, '.br-mode-toggle').addEventListener('click', () => {
    setMode(root, inside(root, '.br-mode-toggle').dataset.mode !== 'iteration_pass');
  });
  inside(root, '.br-photo-btn').addEventListener('click', photoInput);
  inside(root, '.br-form').addEventListener('submit', e => {
    e.preventDefault();
    submitBuild(root, manifest);
  });
}
