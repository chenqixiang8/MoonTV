/* eslint-disable @typescript-eslint/no-explicit-any */
import { IStorage } from './types';
export class ReplicatedStorage {
 constructor(private stores:IStorage[]){}
 private async read(method:keyof IStorage,args:any[]){let error:any;for(const store of this.stores){try{return await (store[method] as any)(...args)}catch(e){error=e;console.warn(`[storage] ${String(method)} fallback`,e)}}throw error||new Error('没有可用数据库')}
 private async write(method:keyof IStorage,args:any[]){const r=await Promise.allSettled(this.stores.map(s=>(s[method] as any)(...args)));if(!r.some(x=>x.status==='fulfilled'))throw (r[0] as PromiseRejectedResult).reason;}
 getPlayRecord(u:string,k:string){return this.read('getPlayRecord',[u,k])} setPlayRecord(u:string,k:string,v:any){return this.write('setPlayRecord',[u,k,v])} getAllPlayRecords(u:string){return this.read('getAllPlayRecords',[u])} deletePlayRecord(u:string,k:string){return this.write('deletePlayRecord',[u,k])}
 getFavorite(u:string,k:string){return this.read('getFavorite',[u,k])} setFavorite(u:string,k:string,v:any){return this.write('setFavorite',[u,k,v])} getAllFavorites(u:string){return this.read('getAllFavorites',[u])} deleteFavorite(u:string,k:string){return this.write('deleteFavorite',[u,k])}
 registerUser(u:string,p:string){return this.write('registerUser',[u,p])} verifyUser(u:string,p:string){return this.read('verifyUser',[u,p])} checkUserExist(u:string){return this.read('checkUserExist',[u])} changePassword(u:string,p:string){return this.write('changePassword',[u,p])} deleteUser(u:string){return this.write('deleteUser',[u])}
 getSearchHistory(u:string){return this.read('getSearchHistory',[u])} addSearchHistory(u:string,k:string){return this.write('addSearchHistory',[u,k])} deleteSearchHistory(u:string,k?:string){return this.write('deleteSearchHistory',[u,k])} getAllUsers(){return this.read('getAllUsers',[])}
 getAdminConfig(){return this.read('getAdminConfig',[])} setAdminConfig(v:any){return this.write('setAdminConfig',[v])} getSkipConfig(u:string,s:string,i:string){return this.read('getSkipConfig',[u,s,i])} setSkipConfig(u:string,s:string,i:string,v:any){return this.write('setSkipConfig',[u,s,i,v])} deleteSkipConfig(u:string,s:string,i:string){return this.write('deleteSkipConfig',[u,s,i])} getAllSkipConfigs(u:string){return this.read('getAllSkipConfigs',[u])}
}
