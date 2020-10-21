<CsoundSynthesizer>
<CsOptions>
-o dac
</CsOptions>
<CsInstruments>
sr = 44100
ksmps = 32
0dbfs = 1
nchnls = 2

        seed    0;
giSine  ftgen   0, 0, 2^10, 10, 1

instr 1 ; i-rate, each note
iPch    random    300, 600
aAmp    linseg    .5, p3, 0
aSine   poscil    aAmp, iPch, giSine
        outs      aSine, aSine
endin

instr 2 ; k-rate (kontrol) noisy but not audio rate
endin

instr 3 ; k-rate with interpolation (sliding pitches)
endin

instr 4 ; a-rate white nosie
endin

</CsInstruments>
<CsScore>
i 1 0   .5
i 1 .25 .5
i 1 .5  .5
i 1 .75 .5
</CsScore>
</CsoundSynthesizer>