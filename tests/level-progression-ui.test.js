import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {levels} from '../src/engine.js';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
test('六关均可直接选择，卡片说明与新机制顺序对应',()=>{
 const root={children:[],append(...children){this.children.push(...children);}};
 const context={screen:null,levels,save:{best:{}},show:()=>{},$:()=>root,document:{createElement:()=>({dataset:{},children:[],append(...children){this.children.push(...children);}})},button:()=>({dataset:{}}),formatTime:String,start(){},menu(){}};
 vm.createContext(context);vm.runInContext(app.slice(app.indexOf('function selectLevel(){'),app.indexOf('function instructions(')),context);context.selectLevel();
 const cards=root.children[0].children;assert.equal(cards.length,6);
 for(let i=0;i<6;i++){assert.notEqual(cards[i].disabled,true);assert.ok(cards[i].innerHTML.includes(levels[i].name));}
 assert.match(cards[1].innerHTML,/开会/);assert.match(cards[2].innerHTML,/打印|卡纸/);assert.match(cards[3].innerHTML,/金椅/);
 assert.match(cards[4].innerHTML,/混合|开会.*打印/);assert.match(cards[5].innerHTML,/抢座/);
});

test('选关插图随新机制移动，混合关同时包含角色和环境道具',()=>{
 const calls=Array.from({length:6},()=>[]),tiles=calls.map((_,i)=>({dataset:{levelArt:String(i)},getContext:()=>({id:i,clearRect(){}})}));
 const renderer={};for(const name of ['portrait','asset','sprite','printer','box','text'])renderer[name]=(c,...args)=>calls[c.id].push([name,...args]);
 const context={renderer,$:()=>null,document:{querySelectorAll:()=>tiles}};
 vm.createContext(context);vm.runInContext(app.slice(app.indexOf('function paintHomeArt(){'),app.indexOf('function menu(){')),context);context.paintHomeArt();
 assert.ok(calls[1].some(c=>c[0]==='text'&&c[1]==='会'));
 assert.ok(calls[2].some(c=>c[0]==='printer'));
 assert.ok(calls[3].some(c=>c[0]==='asset'&&c[1]==='chair-gold'));
 for(const index of [4,5]){assert.ok(calls[index].some(c=>c[0]==='printer'));assert.ok(calls[index].some(c=>c[0]==='asset'&&c[1]==='chair-gold'));}
 assert.ok(calls[4].some(c=>c[0]==='portrait'&&c[1]==='supervisor'));
});
