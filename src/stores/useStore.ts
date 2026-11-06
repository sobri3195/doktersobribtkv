import { create } from 'zustand';
import { load,save } from '../services/storage';
import { type Data } from '../services/model';
const initial=load();
export const useStore=create<{data:Data;error:string;update:(fn:(d:Data)=>Data)=>void;clearError:()=>void}>((set)=>({data:initial.data,error:initial.error,update:fn=>set(s=>{const data=fn(s.data);return {data,error:save(data)};}),clearError:()=>set({error:''})}));
