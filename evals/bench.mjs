import fs from "node:fs";
import path from "node:path";
import {HERE,OUT,R,DiagnosisSchema,zodOutputFormat,client,cost,loadPrompt} from "./common.mjs";
const labels=JSON.parse(fs.readFileSync(path.join(HERE,process.env.LABELS||"labels.tuning.json"),"utf8"));
const CONFIGS={
 "h55-low":{model:"claude-haiku-5-5",thinking:{type:"adaptive"},effort:"low"},
 "h55-high":{model:"claude-haiku-5-5",thinking:{type:"adaptive"},effort:"high"},
 "h55-med":{model:"claude-haiku-5-5",thinking:{type:"adaptive"},effort:"medium"},
 "s5-prod":{model:"claude-sonnet-5",thinking:{type:"disabled"},effort:"medium"},
 "s55-adapt-low":{model:"claude-sonnet-5-5",thinking:{type:"adaptive"},effort:"low"},
 "s55-adapt-med":{model:"claude-sonnet-5-5",thinking:{type:"adaptive"},effort:"medium"},
 "s55-bt-high":{model:"claude-sonnet-5-5",thinking:{type:"between_tools"},effort:"high"},
 "s55-bt-med":{model:"claude-sonnet-5-5",thinking:{type:"between_tools"},effort:"medium"},
};
const [,,names,promptPath,tag,runsArg]=process.argv;
const SYSTEM=loadPrompt(promptPath||R+"/lib/system-prompt.ts");
const runs=+(runsArg||2);
async function call(cfg,c){
  const t=Date.now();
  const p={model:cfg.model,max_tokens:+(process.env.MAXTOK||4096),thinking:cfg.thinking,system:SYSTEM,messages:[{role:"user",content:`Domain: ${c.d}\n\nStatement the student believes is an insight: ${c.s}`}],output_config:{format:zodOutputFormat(DiagnosisSchema),effort:cfg.effort}};
  try{const r=await client.messages.parse(p);
    const types=r.content.map(b=>b.type).join(",");const th=r.content.filter(b=>b.type==="thinking").length;
    return{ok:!!r.parsed_output,cls:r.parsed_output?.classification,out:r.parsed_output,ms:Date.now()-t,u:r.usage,cost:cost(cfg.model,r.usage),stop:r.stop_reason,th,types};}
  catch(e){return{ok:false,err0:1,err:String(e.message).slice(0,300),status:e.status,ms:Date.now()-t,cost:0};}
}
const jobs=[];
for(const n of names.split(",")) for(let run=0;run<runs;run++) for(const c of labels) jobs.push({n,run,c});
for(let i=jobs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[jobs[i],jobs[j]]=[jobs[j],jobs[i]];}
const res=[];let k=0;
async function worker(){while(k<jobs.length){const j=jobs[k++];const r=await call(CONFIGS[j.n],j.c);res.push({cfg:j.n+(tag?"+"+tag:""),id:j.c.id,run:j.run,...r});process.stderr.write(`${res.length}/${jobs.length} ${j.n} ${j.c.id} ${r.ok?r.cls:"ERR "+r.err} ${r.ms}\n`);}}
await Promise.all([0,1,2,3].map(worker));
fs.writeFileSync(path.join(OUT,`res-${names.replace(/,/g,"_")}${tag?"-"+tag:""}.json`),JSON.stringify(res,null,1));
console.log("spent",res.reduce((a,b)=>a+b.cost,0).toFixed(3));