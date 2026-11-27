import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
let source = fs.readFileSync('src/lib/expirationEmail.ts','utf8').replace(/^import .*;\r?$/gm,'').replaceAll('export ', '');
let sends = 0;
const messages = [];
const filters = [];
const claims = new Set();
const client = { async rpc(){ return {error:null}; }, from(table) {
  const q = { select(){return q;}, eq(field,value){filters.push([table,field,value]);return q;}, gt(){return q;}, lt(){return q;}, lte(){return q;},
    insert(key){const k=JSON.stringify(key); if(claims.has(k))return Promise.resolve({error:{code:'23505'}});claims.add(k);return Promise.resolve({error:null});},
    update(){return q;},
    then(resolve){ return Promise.resolve({error:null,data:table==='inventory'?[{id:'i1',name:'Assam Tea Base',expiration_date:'2026-10-15',current_stock:0,unit:'ml',expiration_date_is_demo:true}]:table==='users'?[{id:'a1',email:'admin@example.test'}]:[]}).then(resolve);}
  }; return q;
}};
const api = new Function('supabase','sendRealEmail','commonBrewEmail','emailEscape','emailParagraph',ts.transpile(source,{target:ts.ScriptTarget.ES2022})+'; return {philippineDate,isExpired,sendExpirationAlerts};')(client,async(to,subject,html,text)=>{sends++;messages.push({to,subject,text});return {sent:true};},()=>'',s=>s,s=>s);
assert.equal(api.philippineDate(new Date('2026-11-22T16:00:00Z')),'2026-11-23');
assert.equal(api.isExpired('2026-11-23','2026-11-23'),true);
assert.equal(api.isExpired('2026-11-22','2026-11-23'),true);
assert.equal(api.isExpired(null,'2026-11-23'),false);
await api.sendExpirationAlerts();await api.sendExpirationAlerts();assert.equal(sends,1);
assert.equal(filters.some(([,field])=>field==='expiration_date_is_demo'),false);
assert.equal(messages[0].to,'admin@example.test');
assert.match(messages[0].text,/Assam Tea Base has expired/);
assert.match(messages[0].text,/Expiration date: 2026-10-15/);
assert.match(messages[0].text,/Remaining stock: 0 ml/);
assert.ok(filters.some(([table,field,value])=>table==='users' && field==='role' && value==='Administrator'));
console.log('PASS: expired demo dates and zero stock included, admin recipient, email contents, Philippine midnight, expiration-day boundary, optional dates, duplicate claims. No real email sent.');
