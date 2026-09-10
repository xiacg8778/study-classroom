import type { IdentityContext } from '../contracts/identity'; import { identityKey } from '../contracts/identity';
interface SessionPreferences { consented:boolean; textbookId?:string; lessonId?:string; }
export function savePreferences(identity:IdentityContext,prefs:SessionPreferences):void{sessionStorage.setItem(`education::${identityKey(identity)}`,JSON.stringify(prefs));}
export function readPreferences(identity:IdentityContext):SessionPreferences|undefined{const value=sessionStorage.getItem(`education::${identityKey(identity)}`);if(!value)return undefined;try{return JSON.parse(value) as SessionPreferences;}catch{return undefined;}}
export function clearPreferences(identity:IdentityContext):void{sessionStorage.removeItem(`education::${identityKey(identity)}`);}
