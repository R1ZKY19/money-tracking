import { entity } from '@/components/demo/demoStore';
import { DEMO_USER } from '@/components/demo/demoSeed';
import { exitDemo, demoUnavailable } from '@/components/demo/demoSession';
import demoFinancialMutation from '@/components/demo/demoFinancialMutation';
import demoAgent from '@/components/demo/demoAgent';
// Fail closed: unknown APIs never fall through to the real SDK.
const blocked = new Proxy(async function () { return demoUnavailable(); }, { get: (_,key) => key==='then' ? undefined : blocked });
const cache = new Map();
const entities = new Proxy({}, { get: (_,name) => {
  if(name==='then') return undefined;
  if(!cache.has(name)) cache.set(name,entity(name));
  return cache.get(name);
} });
const functions = { invoke: async (name,payload={}) => {
  if(name==='checkEmailApproval') return {status:200,data:{approved:true,demo:true}};
  if(name==='getUserApprovalDetail') return {status:200,data:{email:DEMO_USER.email,role:'master_1',is_approved:true,access_modules:null}};
  if(name==='secureFinancialMutation') return {status:200,data:demoFinancialMutation(payload)};
  // Automatic notifications are suppressed, not sent or reported as delivered.
  if(['sendTelegramNotif','sendActivityNotification','pushNotification'].includes(name) && payload.mode!=='test') return {status:200,data:{simulated:true,sent:false,message:'Notifikasi eksternal dinonaktifkan pada demo'}};
  return demoUnavailable();
} };
const auth = new Proxy({
  me: async () => (await entities.User.get(DEMO_USER.id)) || structuredClone(DEMO_USER),
  isAuthenticated: async () => true,
  updateMe: async data => entities.User.update(DEMO_USER.id,{...data,id:DEMO_USER.id,email:DEMO_USER.email,role:DEMO_USER.role}),
  logout: exitDemo,
  redirectToLogin: exitDemo,
}, {get:(target,key)=>key in target?target[key]:blocked});
const core = new Proxy({ UploadFile: async ({file})=>({file_url:URL.createObjectURL(file)}) }, {get:(target,key)=>key in target?target[key]:blocked});
const client = { entities, functions, auth,
  integrations:new Proxy({Core:core},{get:(target,key)=>key in target?target[key]:blocked}),
  agents:new Proxy(demoAgent,{get:(target,key)=>key in target?target[key]:blocked}),
  analytics:{track:()=>{}}, appLogs:{logUserInApp:async()=>{}},
};
const demoClient = new Proxy(client,{get:(target,key)=>key==='asServiceRole'?demoClient:key in target?target[key]:blocked});
export default demoClient;