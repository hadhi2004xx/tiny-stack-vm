// Tiny stack VM (make.fun tiny-stack-vm-01), Node 22 stdlib only.
// ISA: kit generator/subject/ISA.md. Per-step order: step limit, pc range,
// opcode, immediate fit, stack under/overflow, then the op's own trap.
import{mkdirSync,readFileSync,readdirSync,writeFileSync}from'node:fs';
// Opcode table by byte 0x00..0x53: char packs imm*16+pops*4+pushes+1 as code+35; '#' (35) = unknown opcode; bytes past the table read as unknown.
const T='$5e(*./3########-------)---)---#---#############DHHD$###########),##############((%(';
// Binary ops by opcode-16 (gaps 7,11,15 are NEG/NOT/invalid, never reached).
const F=[(a,b)=>a+b|0,(a,b)=>a-b|0,Math.imul,(a,b)=>(a/b)|0,(a,b)=>a%b|0,(a,b)=>(a>>>0)/(b>>>0)|0,(a,b)=>(a>>>0)%(b>>>0)|0,0,(a,b)=>a&b,(a,b)=>a|b,(a,b)=>a^b,0,(a,b)=>a<<(b&31),(a,b)=>a>>(b&31),(a,b)=>(a>>>(b&31))|0,0,(a,b)=>a===b?1:0,(a,b)=>a<b?1:0,(a,b)=>(a>>>0)<(b>>>0)?1:0];
function run(g,inp){
  const D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),o=new Uint8Array(65536);
  let sp=0,cp=0,ol=0,ip=0,pc=0,st=0;
  const fin=c=>[c,o.subarray(0,ol)];
  for(;;){
    if(st===1e6)return fin(10);
    if(pc<0||pc>=g.length)return fin(9);
    const b=g[pc],x=(T.charCodeAt(b)|0)-35;
    if(x<=0)return fin(5);
    const m=(x-1)>>4,u=((x-1)>>2)&3,w=(x-1)&3;
    if(pc+m>=g.length)return fin(9);
    st++;pc+=1+m;
    if(sp<u)return fin(2);
    if(sp-u+w>256)return fin(3);
    switch(b){
    case 0:return fin(0);
    case 1:D[sp++]=(g[pc-1]<<24)>>24;break;
    case 2:D[sp++]=g[pc-4]|g[pc-3]<<8|g[pc-2]<<16|g[pc-1]<<24;break;
    case 3:sp--;break;
    case 4:D[sp]=D[sp-1];sp++;break;
    case 5:{const t=D[sp-1];D[sp-1]=D[sp-2];D[sp-2]=t;break;}
    case 6:D[sp]=D[sp-2];sp++;break;
    case 7:{const a=D[sp-3];D[sp-3]=D[sp-2];D[sp-2]=D[sp-1];D[sp-1]=a;break;}
    case 23:case 27:D[sp-1]=b===23?-D[sp-1]|0:~D[sp-1];break;
    case 48:case 49:case 50:{
      const rel=((g[pc-2]|g[pc-1]<<8)<<16)>>16;
      if(b===48||(D[--sp]===0)===(b===49))pc+=rel;
      break;
    }
    case 51:
      if(cp===64)return fin(7);
      C[cp++]=pc;pc=g[pc-2]|g[pc-1]<<8;break;
    case 52:
      if(cp===0)return fin(8);
      pc=C[--cp];break;
    case 64:{
      const a=D[sp-1];
      if(a<0||a>255)return fin(6);
      D[sp-1]=M[a];break;
    }
    case 65:{
      const a=D[sp-1],v=D[sp-2];
      if(a<0||a>255)return fin(6);
      sp-=2;M[a]=v;break;
    }
    case 80:{
      const s=''+D[sp-1];
      if(ol+s.length>65536)return fin(11);
      sp--;
      for(const c of s)o[ol++]=c.charCodeAt(0);
      break;
    }
    case 81:
      if(ol+1>65536)return fin(11);
      o[ol++]=D[--sp]&255;break;
    case 82:D[sp++]=ip<inp.length?inp[ip++]:-1;break;
    case 83:return fin(D[--sp]&255);
    default:{ // binary ops: every other opcode is a case above
      const y=D[sp-1],a=D[sp-2];
      if(!y&&b>18&&b<23)return fin(4);
      sp-=2;D[sp++]=F[b-16](a,y);
    }
    }
  }
}
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
for(const id of readdirSync(I).sort()){
  const[c,out]=run(readFileSync(I+'/'+id+'/program.bin'),readFileSync(I+'/'+id+'/input.bin'));
  mkdirSync(O+'/'+id,{recursive:true});
  writeFileSync(O+'/'+id+'/stdout.bin',out);
  writeFileSync(O+'/'+id+'/exit.txt',c+'\n');
}
