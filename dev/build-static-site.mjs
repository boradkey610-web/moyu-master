import {cp,lstat,mkdir,readFile,rm,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
export function siteFiles(manifest){
 const files=['index.html','style.css','src/app.js','src/engine.js','src/render.js','src/disco.js','assets/manifest.json','dev/dance-review.html'];
 for(const asset of Object.values(manifest)){
  const src=asset.src;
  if(typeof src!=='string'||!src.startsWith('assets/')||!src.endsWith('.png')||src.includes('\\')||src.split('/').some(part=>!part||part==='.'||part==='..')||src.includes(':'))throw new Error('Unsafe asset path');
  files.push(src);
 }
 return [...new Set(files)].sort();
}
export async function buildSite(){
 const manifest=JSON.parse(await readFile(path.join(ROOT,'assets/manifest.json'),'utf8'));
 const files=siteFiles(manifest),out=path.join(ROOT,'dist');
 // Publish only runtime files, never the repository or image-generation config.
 for(const file of files){
  let source=ROOT;
  for(const part of file.split('/')){
   source=path.join(source,part);
   if((await lstat(source)).isSymbolicLink())throw new Error('Symlinks cannot be published');
  }
  if(!(await stat(source)).isFile())throw new Error('Not a runtime file: '+file);
 }
 await rm(out,{recursive:true,force:true});
 let bytes=0;
 for(const file of files){
  const target=path.join(out,file);await mkdir(path.dirname(target),{recursive:true});
  await cp(path.join(ROOT,file),target);bytes+=(await stat(target)).size;
 }
 console.log(JSON.stringify({directory:'dist',files:files.length,bytes,reviewedFiles:files},null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildSite();
