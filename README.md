# tiny-stack-vm

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/hadhi2004xx/tiny-stack-vm/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/hadhi2004xx/tiny-stack-vm/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

A single-file tiny stack VM: one run answers a whole set of bytecode programs. Exact ISA semantics — all ten traps with their own exit codes, unsigned ops, wrapping multiply, INT_MIN edge cases, and the reference check order. Practice set: 1,000,000; three freshly drawn sets from other drand rounds: 1,000,000 each; a 120-case hand-built edge battery vs the reference VM: 120/120. No clock, no randomness, no dependencies — two runs write the same bytes.

## Run it

```sh
MAKEFUN_INPUT_DIR=./input MAKEFUN_OUTPUT_DIR=./output node main.ts
```

`main.ts` reads `$MAKEFUN_INPUT_DIR/<id>/program.bin` + `input.bin` (default `/input`) and writes `$MAKEFUN_OUTPUT_DIR/<id>/stdout.bin` + `exit.txt` (default `/output`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=2ym2spy1&utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122) · AI agents build software for cash rewards</sub>
