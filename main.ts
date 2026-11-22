// Tiny stack VM for make.fun's tiny-stack-vm-01: one file, Node 22 stdlib only.
// Reads /input/<id>/program.bin + input.bin, writes /output/<id>/stdout.bin
// (exact bytes) + exit.txt (decimal code + newline). ISA per generator/subject/ISA.md;
// per-step check order: step limit, pc range, opcode, immediate fit, stack
// underflow, stack overflow, then the op's own trap.
import {mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

// Opcode table, indexed by opcode byte 0x00..0x53. Each char packs one opcode:
// value = imm*16 + pops*4 + pushes + 1, stored as char code value+35;
// '#' (35) = unknown opcode. Bytes past the table read as unknown too.
const T='$5e(*./3########-------)---)---#---#############DHHD$###########),##############((%(';

// Runs one program on its input bytes; returns [exit code, stdout bytes].
function run(g,inp){
  const n=g.length,D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),o=new Uint8Array(65536);
  let sp=0,cp=0,ol=0,ip=0,pc=0,st=0;
  const fin=c=>[c,o.subarray(0,ol)];
  for(;;){
    if(st===1e6)return fin(10);              // step limit, before the pc check
    if(pc<0||pc>=n)return fin(9);            // pc outside the program
    const b=g[pc],x=(T.charCodeAt(b)|0)-35;  // 0 or less: unknown opcode
    if(x<=0)return fin(5);
    const m=(x-1)>>4,u=((x-1)>>2)&3,w=(x-1)&3;
    if(pc+m>=n)return fin(9);                // immediate cut off by the end
    st++;
    const nx=pc+1+m;                        // pc moves past the instruction first
    if(sp<u)return fin(2);                   // stack underflow
    if(sp-u+w>256)return fin(3);             // stack overflow
    pc=nx;
    switch(b){
      case 0:return fin(0);                  // HALT
      case 1:D[sp++]=(g[nx-1]<<24)>>24;break; // PUSH8, sign-extended
      case 2:D[sp++]=g[nx-4]|g[nx-3]<<8|g[nx-2]<<16|g[nx-1]<<24;break; // PUSH32 LE
      case 3:sp--;break;                     // POP
      case 4:D[sp]=D[sp-1];sp++;break;       // DUP
      case 5:{const t=D[sp-1];D[sp-1]=D[sp-2];D[sp-2]=t;break;} // SWAP
      case 6:D[sp]=D[sp-2];sp++;break;       // OVER
      case 7:{const a=D[sp-3];D[sp-3]=D[sp-2];D[sp-2]=D[sp-1];D[sp-1]=a;break;} // ROT
      case 23:case 27:D[sp-1]=b===23?-D[sp-1]|0:~D[sp-1];break; // NEG, NOT
      case 16:case 17:case 18:case 19:case 20:case 21:case 22:
      case 24:case 25:case 26:case 28:case 29:case 30:
      case 32:case 33:case 34:{
        const y=D[sp-1],a=D[sp-2];let r;
        switch(b){
          case 16:r=a+y|0;break;             // ADD wraps
          case 17:r=a-y|0;break;             // SUB wraps
          case 18:r=Math.imul(a,y);break;    // MUL low 32 bits
          case 19:if(!y)return fin(4);r=(a/y)|0;break; // DIV truncates; INT_MIN/-1 wraps via |0
          case 20:if(!y)return fin(4);r=y===-1?0:a%y|0;break; // MOD, sign of dividend
          case 21:if(!y)return fin(4);r=(a>>>0)/(y>>>0)|0;break; // DIVU unsigned
          case 22:if(!y)return fin(4);r=(a>>>0)%(y>>>0)|0;break; // MODU unsigned
          case 24:r=a&y;break;
          case 25:r=a|y;break;
          case 26:r=a^y;break;
          case 28:r=a<<(y&31);break;
          case 29:r=a>>(y&31);break;         // SHR arithmetic
          case 30:r=(a>>>(y&31))|0;break;    // SHRU logical
          case 32:r=a===y?1:0;break;
          case 33:r=a<y?1:0;break;
          case 34:r=(a>>>0)<(y>>>0)?1:0;break; // LTU unsigned
        }
        sp-=2;D[sp++]=r;break;
      }
      case 48:case 49:case 50:{              // JMP, JZ, JNZ
        const rel=((g[nx-2]|g[nx-1]<<8)<<16)>>16;
        let take=true;
        if(b!==48){const v=D[--sp];take=b===49?v===0:v!==0;}
        if(take)pc=nx+rel;
        break;
      }
      case 51:                               // CALL
        if(cp===64)return fin(7);
        C[cp++]=nx;pc=g[nx-2]|g[nx-1]<<8;break;
      case 52:                               // RET
        if(cp===0)return fin(8);
        pc=C[--cp];break;
      case 64:{                              // LOAD
        const a=D[sp-1];
        if(a<0||a>255)return fin(6);
        D[sp-1]=M[a];break;
      }
      case 65:{                              // STORE
        const a=D[sp-1],v=D[sp-2];
        if(a<0||a>255)return fin(6);
        sp-=2;M[a]=v;break;
      }
      case 80:{                              // PRINT, all-or-nothing vs the limit
        const s=String(D[sp-1]);
        if(ol+s.length>65536)return fin(11);
        sp--;
        for(let i=0;i<s.length;i++)o[ol++]=s.charCodeAt(i);
        break;
      }
      case 81:                               // PUTC
        if(ol+1>65536)return fin(11);
        o[ol++]=D[--sp]&255;break;
      case 82:D[sp++]=ip<inp.length?inp[ip++]:-1;break; // IN, -1 past the end
      case 83:return fin(D[--sp]&255);       // EXIT, low byte
    }
  }
}

const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
for(const id of readdirSync(I).sort()){
  const[c,out]=run(readFileSync(join(I,id,'program.bin')),readFileSync(join(I,id,'input.bin')));
  mkdirSync(join(O,id),{recursive:true});
  writeFileSync(join(O,id,'stdout.bin'),out);
  writeFileSync(join(O,id,'exit.txt'),c+'\n');
}
