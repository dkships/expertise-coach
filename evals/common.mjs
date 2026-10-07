import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
export const HERE=path.dirname(fileURLToPath(import.meta.url));
export const R=path.resolve(HERE,"..");
export const OUT=path.join(HERE,"out");
fs.mkdirSync(OUT,{recursive:true});
export const Anthropic=(await import(R+"/node_modules/@anthropic-ai/sdk/index.mjs")).default;
export const {zodOutputFormat}=await import(R+"/node_modules/@anthropic-ai/sdk/helpers/zod.mjs");
export const {z}=await import(R+"/node_modules/zod/index.js");
export function loadPrompt(p){const src=fs.readFileSync(p,"utf8");return eval("("+src.replace("export const SYSTEM =","").replace(/;\s*$/,"")+")");}
export const LEVELS=["FACT","INSIGHT","POINT OF VIEW"];
export const DiagnosisSchema=z.object({classification:z.enum(LEVELS),why:z.string(),examples:z.object({fact:z.string(),insight:z.string(),pov:z.string()}),question:z.string()});
export const PRICE={"claude-sonnet-5":[2,10],"claude-sonnet-5-5":[2,10],"claude-opus-5-5":[4,20],"claude-haiku-5-5":[0.1,0.5]};
export const cost=(m,u)=>{const [i,o]=PRICE[m];return (u.input_tokens*i+(u.cache_read_input_tokens||0)*i*0.1+(u.cache_creation_input_tokens||0)*i*1.25+u.output_tokens*o)/1e6;};
export const client=new Anthropic();