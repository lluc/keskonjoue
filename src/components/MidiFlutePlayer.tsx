import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Slider, Stack, Typography } from "@mui/material";
import FluteTablature, { extractNotesFromMidi, getInstrument, INSTRUMENTS, MidiNoteEvent } from "./FluteTablature";

interface MidiFlutePlayerProps {
    title: string;
    events: MidiNoteEvent[];
    durationMs: number;
}

const midiToFreq = (pitch: number) => 440 * Math.pow(2, (pitch - 69) / 12);

// Lecteur MIDI "maison" : pas de moteur abcjs ici (pas d'ABC source), on pilote
// nous-mêmes un synthétiseur minimal (oscillateur) et une minuterie pour le
// surlignage/défilement de la tablature, calée sur l'horloge de l'AudioContext
// (qui se fige naturellement avec suspend(), ce qui simplifie la pause/reprise).
const MidiFlutePlayer = ({ title, events, durationMs }: MidiFlutePlayerProps) => {
    const [instrumentId, setInstrumentId] = useState<string>(INSTRUMENTS[0].id);
    const [isPlaying, setIsPlaying] = useState(false);
    const [warp, setWarp] = useState(100);

    const notes = useMemo(
        () => extractNotesFromMidi(events, getInstrument(instrumentId)),
        [events, instrumentId]
    );
    const notesRef = useRef(notes);
    useEffect(() => { notesRef.current = notes; }, [notes]);

    const warpRef = useRef(warp);
    useEffect(() => { warpRef.current = warp; }, [warp]);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const scheduledRef = useRef<{ osc: OscillatorNode }[]>([]);
    const songMsAtStartRef = useRef(0);
    const ctxTimeAtStartRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const activeIndexRef = useRef<number | null>(null);

    const getAudioCtx = () => {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
        return audioCtxRef.current;
    };

    const clearHighlight = () => {
        document.querySelectorAll('.flute-tab-note-playing').forEach((el) => el.classList.remove('flute-tab-note-playing'));
        activeIndexRef.current = null;
    };

    const cancelScheduled = () => {
        scheduledRef.current.forEach(({ osc }) => {
            try { osc.stop(); } catch { /* déjà arrêtée */ }
        });
        scheduledRef.current = [];
    };

    const currentSongMs = () => {
        const ctx = audioCtxRef.current;
        if (!ctx) return songMsAtStartRef.current;
        return songMsAtStartRef.current + (ctx.currentTime - ctxTimeAtStartRef.current) * 1000 * (warpRef.current / 100);
    };

    const scheduleFrom = (fromMs: number) => {
        const ctx = getAudioCtx();
        const warpFactor = warpRef.current / 100;
        notesRef.current.forEach((note) => {
            if (note.startMs === undefined || note.endMs === undefined || note.endMs <= fromMs) return;
            const playAt = ctx.currentTime + Math.max(0, note.startMs - fromMs) / 1000 / warpFactor;
            const dur = Math.max((note.endMs - note.startMs) / 1000 / warpFactor, 0.05);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = midiToFreq(note.midiPitch);
            gain.gain.setValueAtTime(0, playAt);
            gain.gain.linearRampToValueAtTime(0.25, playAt + 0.01);
            gain.gain.setValueAtTime(0.25, Math.max(playAt + 0.01, playAt + dur - 0.03));
            gain.gain.linearRampToValueAtTime(0, playAt + dur);
            osc.connect(gain).connect(ctx.destination);
            osc.start(playAt);
            osc.stop(playAt + dur + 0.02);
            scheduledRef.current.push({ osc });
        });
    };

    const tick = () => {
        const ms = currentSongMs();
        let idx = -1;
        for (let i = 0; i < notesRef.current.length; i++) {
            const n = notesRef.current[i];
            if (n.startMs !== undefined && n.endMs !== undefined && ms >= n.startMs && ms < n.endMs) {
                idx = i;
                break;
            }
        }
        if (idx !== activeIndexRef.current) {
            clearHighlight();
            if (idx >= 0) {
                const el = document.querySelector(`[data-note-key="${notesRef.current[idx].domKey}"]`);
                el?.classList.add('flute-tab-note-playing');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            activeIndexRef.current = idx;
        }
        if (ms >= durationMs) {
            pausePlayback();
            songMsAtStartRef.current = 0;
            return;
        }
        rafRef.current = requestAnimationFrame(tick);
    };

    const pausePlayback = () => {
        songMsAtStartRef.current = currentSongMs();
        cancelScheduled();
        audioCtxRef.current?.suspend();
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setIsPlaying(false);
    };

    const startPlaybackFrom = (ms: number) => {
        const ctx = getAudioCtx();
        ctx.resume();
        ctxTimeAtStartRef.current = ctx.currentTime;
        songMsAtStartRef.current = ms;
        scheduleFrom(ms);
        setIsPlaying(true);
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tick);
    };

    const togglePlay = () => {
        if (isPlaying) {
            pausePlayback();
        } else {
            startPlaybackFrom(songMsAtStartRef.current >= durationMs ? 0 : songMsAtStartRef.current);
        }
    };

    const handleWarpCommitted = (_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
        if (Array.isArray(newValue)) return;
        warpRef.current = newValue;
        setWarp(newValue);
        if (isPlaying) {
            const frozenMs = currentSongMs();
            cancelScheduled();
            startPlaybackFrom(frozenMs);
        }
    };

    useEffect(() => {
        return () => {
            cancelScheduled();
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            clearHighlight();
            audioCtxRef.current?.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Stack spacing={2}>
            <Typography variant="h3">{title}</Typography>
            <Stack>
                <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.default', py: 1 }}>
                    <Button variant="contained" onClick={togglePlay}>
                        {isPlaying ? 'Pause' : 'Jouer'}
                    </Button>
                </Box>
                <Box>
                    <Typography id="warp-slider" gutterBottom>
                        Vitesse: {warp}%
                    </Typography>
                    <Slider
                        value={warp}
                        onChange={(_e, v) => !Array.isArray(v) && setWarp(v)}
                        onChangeCommitted={handleWarpCommitted}
                        aria-labelledby="warp-slider"
                        min={25}
                        max={200}
                        step={5}
                        marks={[
                            { value: 50, label: '50%' },
                            { value: 100, label: '100%' },
                            { value: 150, label: '150%' },
                        ]}
                    />
                </Box>
                <FluteTablature notes={notes} instrumentId={instrumentId} onInstrumentChange={setInstrumentId} />
            </Stack>
        </Stack>
    );
};

export default MidiFlutePlayer;
