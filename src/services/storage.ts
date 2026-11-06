import { dataSchema, defaults, type Data } from './model';
export const KEYS={data:'nexam:data',recovery:'nexam:recovery'};
export function migrate(value:unknown):Data {if(typeof value==='object'&&value!==null&&'version' in value&&value.version===1){return dataSchema.parse({...defaults(),...value,version:2});}return dataSchema.parse(value);}
export function load():{data:Data;error:string} {try {const raw=localStorage.getItem(KEYS.data);return {data:raw?migrate(JSON.parse(raw)):defaults(),error:''};}catch {return {data:defaults(),error:'Data lokal rusak atau tidak dapat dibaca. Ekspor data pemulihan sebelum menyimpan ulang.'};}}
export function save(data:Data):string {try{const old=localStorage.getItem(KEYS.data);if(old){try{migrate(JSON.parse(old));}catch{localStorage.setItem(KEYS.recovery,old);}}localStorage.setItem(KEYS.data,JSON.stringify(dataSchema.parse(data)));return '';}catch{return 'Penyimpanan gagal. Memori penuh atau akses ditolak; ekspor cadangan sebelum menutup halaman.';}}
export function parseBackup(text:string):Data{return migrate(JSON.parse(text));}
export function download(name:string,text:string,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
