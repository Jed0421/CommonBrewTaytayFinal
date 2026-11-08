import assert from 'node:assert/strict';
import http from 'node:http';
import bcrypt from 'bcryptjs';
process.env.COMMONBREW_SERVERLESS='1';
process.env.SUPABASE_URL='https://fixture.supabase.co';
process.env.SUPABASE_SERVICE_KEY='sb_secret_test_only';
process.env.DOTENV_CONFIG_PATH='missing-test-env';
const realFetch=globalThis.fetch;
const tables={
 users:[{id:'fixture-staff',username:'tester',full_name:'Test Staff',role:'Administrator',is_active:true,password_hash:bcrypt.hashSync('correct-password',4)}, {id:'fixture-customer',username:'customer',email:'customer@example.test',full_name:'Test Customer',role:'Customer',password_hash:bcrypt.hashSync('customer-password',4)}],
 products:[{id:'fixture-product',name:'Database Coffee',category_id:'fixture-cat',price:99,is_available:true}],
 categories:[{id:'fixture-cat',name:'Coffee'}],inventory:[],inventory_logs:[],product_recipes:[],product_upsize_recipes:[],transactions:[],online_orders:[],store_settings:[],server_state:[]
};
let failUsers=false;
let failWrites=false;
globalThis.fetch=async(input,init={})=>{
 const url=new URL(typeof input==='string'?input:input.url || input);
 if(url.hostname!=='fixture.supabase.co') return realFetch(input,init);
 const table=url.pathname.split('/').pop();
 if(failUsers&&table==='users')return new Response(JSON.stringify({message:'fixture database offline'}),{status:503});
 let rows=tables[table];assert.ok(rows,`Unexpected table ${table}`);
 const matches=row=>[...url.searchParams].every(([k,v])=>!v.startsWith('eq.')||String(row[k])===v.slice(3));
 if(init.method==='POST'){
  if(failWrites && table==='users') return new Response(JSON.stringify({message:'fixture write failed'}), {status:400});
  if(table==='users') await new Promise(resolve=>setTimeout(resolve,30));
  const data=JSON.parse(init.body);const records=Array.isArray(data)?data:[data];
  for(const row of records){const index=rows.findIndex(r=>table==='server_state'?r.namespace===row.namespace&&r.key_hash===row.key_hash:r.id===row.id);if(index<0)rows.push(row);else rows[index]=row;}
  return new Response(null,{status:201});
 }
 if(init.method==='DELETE'){tables[table]=rows.filter(r=>!matches(r));return new Response(null,{status:204});}
 const result=rows.filter(matches);
 const accept=new Headers(init.headers).get('accept')||'';
 return new Response(JSON.stringify(accept.includes('object')?(result[0]||null):result),{status:200,headers:{'content-type':'application/json'}});
};
const {default:handler}=await import('../api/index.ts');
const server=http.createServer((req,res)=>handler(req,res));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
async function call(path,body,token){const response=await realFetch(base+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json()};}
try{
 let r=await call('/api/products');assert.equal(r.status,200);assert.equal(r.data.length,1);assert.equal(r.data[0].name,'Database Coffee');
 r=await call('/api/auth/unified-login',{identifier:'tester',password:'wrong'});assert.equal(r.status,401);
 r=await call('/api/auth/unified-login',{identifier:'tester',password:'correct-password'});assert.equal(r.status,200);const token=r.data.token;assert.ok(token);assert.equal(tables.server_state[0].value.token,undefined);
 r=await call('/api/auth/me',undefined,token);assert.equal(r.status,200);assert.equal(r.data.id,'fixture-staff');
 r=await call('/api/auth/logout',{},token);assert.equal(r.status,200);
 r=await call('/api/auth/me',undefined,token);assert.equal(r.status,401);
 r=await call('/api/auth/unified-login',{identifier:'customer@example.test',password:'customer-password'});assert.equal(r.status,200);const customerToken=r.data.token;
 r=await call('/api/customer/me',undefined,customerToken);assert.equal(r.status,200);
 r=await call('/api/customer/update-profile',{address:'Saved fixture address'},customerToken);assert.equal(r.status,200);assert.equal(tables.users.find(u=>u.id==='fixture-customer').address,'Saved fixture address');
 failWrites=true;r=await call('/api/customer/update-profile',{address:'Must fail'},customerToken);assert.equal(r.status,503);failWrites=false;
 const {PersistentStore}=await import('../src/lib/serverStore.ts');
 const firstStore=new PersistentStore('email-otp',true);const secondStore=new PersistentStore('email-otp',true);
 await firstStore.set('test@example.test',{otp:'123456',expiresAt:Date.now()+60000,isVerified:false});assert.equal((await secondStore.get('test@example.test')).otp,'123456');
 await firstStore.set('expired@example.test',{otp:'123456',expiresAt:Date.now()-1,isVerified:false});assert.equal(await secondStore.get('expired@example.test'),undefined);
 failUsers=true;r=await call('/api/products');assert.equal(r.status,503);
 console.log('PASS: products from database; wrong password rejected; staff/customer login; cross-instance session; logout; no raw stored tokens; database failure returns 503.');
}finally{server.close();server.closeAllConnections();}
