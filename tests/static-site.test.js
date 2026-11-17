import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {siteFiles} from '../dev/build-static-site.mjs';

test('static release contains runtime files and manifest assets only',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../assets/manifest.json',import.meta.url)));
 const files=siteFiles(manifest);
 assert.ok(files.includes('index.html'));assert.ok(files.includes('dev/dance-review.html'));
 assert.ok(files.includes(manifest['player-dance'].src));
 assert.ok(files.includes('src/audio.js'));assert.ok(files.includes('src/disco.js'));assert.ok(files.includes('src/runner.js'));assert.ok(files.includes('src/office-layout.js'));
 assert.ok(files.every(file=>!file.startsWith('config/')&&!file.startsWith('DramaClip/')&&!file.startsWith('.')));
 assert.ok(files.includes(manifest['player-typing'].src));
 assert.equal(files.length,14+new Set(Object.values(manifest).map(asset=>asset.src)).size);
});
test('发布包包含每个运行模块的相对JS依赖',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../assets/manifest.json',import.meta.url))),files=siteFiles(manifest);
 for(const file of files.filter(file=>file.endsWith('.js'))){
  const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  for(const match of source.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)){
   const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));
   assert.ok(files.includes(dependency),`${file} 的依赖 ${dependency} 应随包发布`);
  }
 }
});
test('static release rejects traversal, external URLs and credentials',()=>{
 for(const src of ['assets/../config/key.png','/assets/player.png','assets\\player.png','https://host/key.png','assets/.env','assets//key.png','assets/./key.png'])assert.throws(()=>siteFiles({unsafe:{src}}),/Unsafe asset path/);
});
test('static release deduplicates asset paths',()=>{
 assert.equal(siteFiles({a:{src:'assets/player.png'},b:{src:'assets/player.png'}}).filter(file=>file==='assets/player.png').length,1);
});
