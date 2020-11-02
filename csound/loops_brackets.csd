<CsoundSynthesizer>
<CsOptions>
</CsOptions>
<CsInstruments>
sr = 44100
ksmps = 4
nchnls = 2
0dbfs = 1

giSine ftgen 0, 0, 4096, 10, 1

; a sine wave with a plucked envelope:
instr 1

idur = p3
iamp = p4
ifrq cps2pch p5, 12

kamp line iamp, idur, 0
asig oscili kamp, ifrq, giSine

outs asig, asig
endin

</CsInstruments>
<CsScore>

r 4
t 0 120

i1 0 1 0.25 9.00
i1 +
i1 + . . 9.04
i1 +
i1 + . . 9.07
i1 +
i1 + 2 . 9.04
s

</CsScore>
</CsoundSynthesizer>