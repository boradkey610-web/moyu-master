import {readFile,access} from 'node:fs/promises';
import {constants} from 'node:fs';

const contractPath=new URL('../design/contract.json',import.meta.url);
const contract=JSON.parse(await readFile(contractPath,'utf8'));
const problems=[];
const summaries=[];

for(const component of contract.components){
  const summary={id:component.id,ok:true,checks:[]};
  const check=(name,passed,detail='')=>{
    summary.checks.push({name,passed,detail});
    if(!passed){
      summary.ok=false;
      problems.push(`${component.id}: ${name}${detail?` - ${detail}`:''}`);
    }
  };

  check('id',typeof component.id==='string'&&component.id.length>0);
  check('type',['canvas','dom'].includes(component.type));
  check('states',Array.isArray(component.states)&&component.states.length>0);
  check('constraints',Array.isArray(component.constraints)&&component.constraints.length>0);

  if(component.type==='canvas'){
    check('implementation',component.implementation==='src/components.js');
    check('consumer',component.consumer==='src/render.js');
  }else{
    check('consumer',component.consumer==='src/app.js');
  }

  try{
    const implementationPath=new URL(`../${component.implementation}`,import.meta.url);
    await access(implementationPath,constants.R_OK);
    const source=await readFile(implementationPath,'utf8');
    check('export',source.includes(`export function ${component.export}`));
  }catch(error){
    check('implementation-file',false,error.message);
  }

  try{
    await access(new URL(`../${component.designReference}`,import.meta.url),constants.R_OK);
    check('design-reference',true);
  }catch(error){
    check('design-reference',false,error.message);
  }

  summaries.push(summary);
}

console.log(JSON.stringify({ok:problems.length===0,components:summaries},null,2));
if(problems.length)process.exit(1);
