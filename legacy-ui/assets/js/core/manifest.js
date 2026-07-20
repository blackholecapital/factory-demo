export async function loadManifest(){
  const res = await fetch('./manifest.json', {cache:'no-store'});
  if(!res.ok) throw new Error('manifest load failed');
  return res.json();
}
