import fs from "node:fs";
import path from "node:path";
import {HERE,OUT,R,z,zodOutputFormat,client,cost,loadPrompt} from "./common.mjs";
const cases=JSON.parse(fs.readFileSync(path.join(HERE,process.env.CASES||"cases.tuning.json"),"utf8"));
const SYSTEM=loadPrompt(R+"/lib/system-prompt.ts");
const defs=SYSTEM.split("HARD RULE")[0].trim();
const intent=`Additional context from the app's author:
- The app's teaching copy for each level: FACT: "Anyone can look it up. Nobody argues with it." INSIGHT: "Your read on the facts. Someone just as smart could read them differently." SPIKY POINT OF VIEW: "You would have to defend it. Someone who knows your field thinks you are wrong."
- The author's README says the core error the app exists to catch is "misreading a causal reading as a position" — that is exactly the distinction being taught.`;
const mode=process.argv[2];
const sys=`You are an expert annotator building a gold-label test set for a classifier used in a high-school coaching app. Label each student statement with the level it actually lands in, using the taxonomy below. Judge the statement as written, not a charitable rewrite.

${defs}
${mode==="intent"?"\n"+intent+"\n":""}
For each case give: your label; confidence (high / medium / low); whether a competent annotator applying this taxonomy could reasonably pick a different label (ambiguous true/false) and, if so, which; and a one-sentence note on what decided it.`;
const Out=z.object({labels:z.array(z.object({id:z.string(),label:z.enum(["FACT","INSIGHT","POINT OF VIEW"]),confidence:z.enum(["high","medium","low"]),ambiguous:z.boolean(),alternative:z.string(),note:z.string()}))});
const user=cases.map(c=>`id: ${c.id}\ndomain: ${c.d}\nstatement: ${c.s}`).join("\n\n");
const t=Date.now();
const r=await client.messages.parse({model:"claude-opus-5-5",max_tokens:16000,system:sys,messages:[{role:"user",content:user}],output_config:{format:zodOutputFormat(Out),effort:"high"}});
const c=cost("claude-opus-5-5",r.usage);
fs.writeFileSync(path.join(OUT,`${process.env.TAG||"judge"}-${mode}-${process.argv[3]||0}.json`),JSON.stringify({usage:r.usage,cost:c,ms:Date.now()-t,stop:r.stop_reason,out:r.parsed_output},null,1));
console.log(mode,r.stop_reason,c.toFixed(4),Date.now()-t);