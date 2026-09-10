export type IdempotencyLookup<T>={kind:'miss'}|{kind:'hit';value:T}|{kind:'conflict'};
interface Entry { hash:string; value:unknown; }
export class LocalDemoIdempotencyStore { private readonly entries=new Map<string,Entry>(); public lookup<T>(key:string,hash:string):IdempotencyLookup<T>{ const entry=this.entries.get(key); if(!entry)return{kind:'miss'}; if(entry.hash!==hash)return{kind:'conflict'}; return{kind:'hit',value:entry.value as T}; } public remember<T>(key:string,hash:string,value:T):void{this.entries.set(key,{hash,value});} public clear():void{this.entries.clear();} }
