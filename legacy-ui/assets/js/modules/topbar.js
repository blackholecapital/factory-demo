export function initTopbar(manifest){
  document.addEventListener('click', e => {
    const files = e.target.closest('[data-nav="files"]');
    if(files) location.href = manifest.services.uiFiles;
  });
}
