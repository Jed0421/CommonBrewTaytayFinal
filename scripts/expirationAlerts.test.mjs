import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
let source = fs.readFileSync('src/lib/expirationEmail.ts','utf8').replace(/^import .*;\r?$/gm,'').replaceAll('export ', '');
let sends = 0;
const claims = new Set();
const client = { from(table) {
  const q = { select(){return q;}, eq(){return q;}, gt(){return q;}, lt(){return q;},
    insert(key){const k=JSON.stringify(key); if(claims.has(k))return Promise.resolve({error:{code:'23505'}});claims.add(k);return Promise.resolve({error:null});},
    update(){return q;},
    then(resolve){ return Promise.resolve({error:null,data:table==='inventory'?[{id:'i1',name:'Assam Tea Base',expiration_date:'2026-10-15',current_stock:10,unit:'ml'}]:table==='users'?[{id:'a1',email:'admin@example.test'}]:[]}).then(resolve);}
  }; return q;
}};
const api = new Function('supabase','sendRealEmail','commonBrewEmail','emailEscape','emailParagraph',ts.transpile(source,{target:ts.ScriptTarget.ES2022})+'; return {philippineDate,isExpired,sendExpirationAlerts};')(client,async()=>{sends++;return {sent:true};},()=>'',s=>s,s=>s);
assert.equal(api.philippineDate(new Date('2026-11-22T16:00:00Z')),'2026-11-23');
assert.equal(api.isExpired('2026-11-23','2026-11-23'),false);
assert.equal(api.isExpired('2026-11-22','2026-11-23'),true);
assert.equal(api.isExpired(null,'2026-11-23'),false);
await api.sendExpirationAlerts();await api.sendExpirationAlerts();assert.equal(sends,1);
console.log('PASS: Philippine midnight, expiration-day boundary, optional dates, duplicate claims. No real email sent.');
