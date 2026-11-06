import {readFileSync,writeFileSync} from 'node:fs';
import {categories,questionSchema,type Question} from '../src/services/model';
const questions:Question[]=[];let errors=0;const stems=new Set<string>();const ids=new Set<string>();
const normalize=(s:string)=>s.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
for(const [program,cats] of Object.entries(categories))for(const category of Object.keys(cats)){try {const data=JSON.parse(readFileSync(new URL(`../src/data/questions/${program}/${category}.json`,import.meta.url),'utf8'));if(!Array.isArray(data))throw Error('Array diperlukan');if(data.length!==50){console.error(`${program}/${category}: ${data.length}, wajib 50`);errors++;}for(const raw of data){const q=questionSchema.parse(raw);if(q.program!==program||q.category!==category)throw Error(`Kategori salah: ${q.id}`);const stem=normalize(q.question);if(ids.has(q.id)||stems.has(stem))throw Error(`Duplikat: ${q.id}`);ids.add(q.id);stems.add(stem);questions.push(q);}}catch(e){console.error(`${program}/${category}:`,String(e));errors++;}}
const similar:{a:string;b:string;similarity:number}[]=[];
for(let i=0;i<questions.length;i++)for(let j=i+1;j<questions.length;j++){const a=new Set(normalize(questions[i].question).split(' '));const b=new Set(normalize(questions[j].question).split(' '));const common=[...a].filter(t=>b.has(t)).length;const similarity=common/(a.size+b.size-common);if(similarity>.65)similar.push({a:questions[i].id,b:questions[j].id,similarity});}
writeFileSync('docs/similarity-report.json',JSON.stringify(similar,null,2)+'\n');
console.log(`${questions.length} soal valid; ${similar.length} pasangan perlu tinjauan kemiripan.`);if(questions.length!==550)errors++;process.exitCode=errors?1:0;
