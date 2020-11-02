<CsoundSynthesizer>
<CsOptions>
</CsOptions>
<CsInstruments>

sr = 44100
ksmps = 4
nchnls = 2
0dbfs = 1

giSine ftgen 0, 0, 4096, 10, 1

; sequence data
giPitches     ftgen 0, 0, -5, -2,    9.00, 9.00, 9.04, 9.04, 9.07
giStepLen     ftgen 0, 0, -5, -2,    1, 1, 1, 1, 3
giDurations   ftgen 0, 0, -5, -2,    0.5, 0.5, 0.5, 0.5, 0.5
gkMetro init 0

; a metronome:
instr 1
gkMetro metro p4
endin

; a phrase player:
instr 2
iseqlength = p4
kstepnum init 0
ksteplen init 1
kpitch init 9.00
kdur init 0.5
kwait init 1
if (gkMetro == 1) then
	if (kwait == 0) then
		kpitch table kstepnum, giPitches
		kdur table kstepnum, giDurations
		event "i", p5, 0, kdur, 0.25, kpitch
		ksteplen table kstepnum, giStepLen
		kwait = ksteplen - 1
		kstepnum = kstepnum + 1
		if (kstepnum >= iseqlength) then
			kstepnum = 0
		endif
	else
		kwait = kwait - 1
	endif
endif
endin

; a sine wave with a plucked envelope:
instr 11
idur = p3
iamp = p4
ifrq cps2pch p5, 12
kamp linsegr iamp, idur, 0.1, 0.5, 0
asig oscili kamp, ifrq, giSine
outs asig, asig
endin

instr 12
idur = p3
iamp = p4
ifrq cps2pch p5, 12
kamp linsegr iamp, idur, 0.1, 0.5, 0
asig oscili kamp, ifrq, giSine
outs asig, asig
endin

</CsInstruments>
<CsScore>

; run the metronome for 16 seconds
i1 0 16 2
; play the sequence:
i2 0 16 5 11

</CsScore>
</CsoundSynthesizer>