async function html(path){
  const res = await fetch(path, {cache:'no-store'});
  if(!res.ok) throw new Error(`section load failed: ${path}`);
  return res.text();
}

async function cssFor(path){
  const css = path.replace(/\.html$/, '.css');
  const res = await fetch(css, {cache:'no-store'});
  if(res.ok){
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = css;
    document.head.appendChild(link);
  }
}

export async function mountSections(manifest){
  for(const [key,path] of Object.entries(manifest.mounts)){
    const el = document.querySelector(`[data-mount="${key}"]`);
    if(!el) continue;
    el.innerHTML = await html(path);
    await cssFor(path);
  }
}
