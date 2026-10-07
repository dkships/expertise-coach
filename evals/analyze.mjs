import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const HERE=path.dirname(fileURLToPath(import.meta.url));
const L=Object.fromEntries(JSON.parse(fs.readFileSync(path.join(HERE,process.env.LABELS||"labels.tuning.json"),"utf8")).map(l=>[l.id,l]));
const res=process.argv.slice(2).flatMap(f=>JSON.parse(fs.readFileSync(fs.existsSync(f)?f:path.join(HERE,"out",f),"utf8")));
const by={};res.forEach(r=>(by[r.cfg]??=[]).push(r));
const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.ceil(p*s.length)-1)]};
const ab=x=>({"FACT":"F","INSIGHT":"I","POINT OF VIEW":"P"})[x]||"x";
console.log("cfg | gold(23x2) | clean(17x2) | author-labels | lenient | valid | consist | p50 | p95 | $/call | outTok p50 | thinkBlocks");
for(const [cfg,rs] of Object.entries(by)){
 const ok=rs.filter(r=>r.ok);
 const gold=ok.filter(r=>r.cls===L[r.id].gold).length;
 const clean=rs.filter(r=>!L[r.id].ambiguous);const cleanOk=clean.filter(r=>r.cls===L[r.id].gold).length;
 const auth=ok.filter(r=>r.cls===L[r.id].author).length;
 const len=ok.filter(r=>L[r.id].accept.includes(r.cls)).length;
 const ids=Object.keys(L);const cons=ids.filter(id=>{const x=rs.filter(r=>r.id===id).map(r=>r.cls);return x.length===2&&x[0]===x[1]}).length;
 const ms=rs.map(r=>r.ms);const out=ok.map(r=>r.u.output_tokens);
 console.log(`${cfg} | ${gold}/${rs.length} | ${cleanOk}/${clean.length} | ${auth}/${rs.length} | ${len}/${rs.length} | ${ok.length}/${rs.length} | ${cons}/${ids.length} | ${(pct(ms,.5)/1000).toFixed(1)}s | ${(pct(ms,.95)/1000).toFixed(1)}s | $${(rs.reduce((a,b)=>a+b.cost,0)/rs.length).toFixed(4)} | ${pct(out,.5)} | ${ok.filter(r=>r.th>0).length}`);
 const miss={};ok.filter(r=>r.cls!==L[r.id].gold).forEach(r=>{miss[r.id]=(miss[r.id]||"")+ab(r.cls)});
 console.log("   misses vs gold:",Object.entries(miss).map(([k,v])=>`${k}(${ab(L[k].gold)}→${v})`).join(" "), "| stops:",[...new Set(rs.map(r=>r.stop))].join(","));
}