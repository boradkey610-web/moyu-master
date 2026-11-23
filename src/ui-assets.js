export const uiAssets=Object.fromEntries(['primary','secondary','toggle-on','toggle-off','coin','clock','square','joke','game','dance','mirror','meeting','help'].map(name=>[name,`assets/generated/ui-paper-v1/${name}.png`]));
for(const name of ['level-1','level-2','level-3','level-4','level-5','level-6','wall-clock','texture'])uiAssets[name]=`assets/generated/level-select-v1/${name}.png`;
for(const name of ['logo','scene','texture'])uiAssets['home-'+name]=`assets/generated/home-v1/${name}.png`;

// Keep SVG wrappers for existing summary/assist clones; the approved PNG supplies their artwork.
export function installUiArt(){
 for(const [selector,name] of [['.activity.joke svg','joke'],['.activity.game svg','game'],['.activity.dance svg','dance'],['#mirror svg','mirror'],['#meeting svg','meeting'],['#help svg','help'],['.hud-clock svg','clock']]){
  const icon=document.querySelector(selector);
  icon.classList.add('paper-icon');icon.style.backgroundImage=`url("${uiAssets[name]}")`;
 }
}

export async function loadUiArt(){
 const results=await Promise.all(Object.values(uiAssets).map(src=>new Promise(resolve=>{
  const img=new Image();img.onload=()=>resolve(null);img.onerror=()=>resolve(`UI asset unavailable: ${src}`);img.src=src;
 })));
 return results.filter(Boolean);
}
