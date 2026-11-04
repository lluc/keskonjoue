import { useId } from "react";
import { Box, MenuItem, Select, SelectChangeEvent, Stack, Typography } from "@mui/material";
import ABCJS, { TuneObjectArray } from "abcjs";
import { RECORDER_INSTRUMENTS } from "./recorderFingering";

export type FluteKey = "D" | "G" | "C" | "Bb" | "A";

export const FLUTE_KEYS: { value: FluteKey; label: string; pitchClass: number }[] = [
    { value: "D", label: "Ré", pitchClass: 2 },
    { value: "G", label: "Sol", pitchClass: 7 },
    { value: "C", label: "Do", pitchClass: 0 },
    { value: "Bb", label: "Sib", pitchClass: 10 },
    { value: "A", label: "La", pitchClass: 9 },
];

export type HoleState = "closed" | "half" | "open";

// Décrit un instrument à vent sélectionnable dans la tablature : sa tonique (pour calculer
// l'écart en demi-tons de chaque note jouée), sa fondamentale MIDI (pour déterminer le
// registre/octave) et sa fonction de doigté propre (nombre de trous variable : 6 pour le
// tin whistle, 8 - pouce compris - pour la flûte à bec).
export interface WindInstrument {
    id: string;
    label: string;
    tonicPitchClass: number;
    fundamentalMidi: number;
    fingeringFor: (semitoneFromTonic: number, octave: number) => HoleState[];
}

// Doigté traditionnel flûte/tin whistle : les 6 trous se ferment de haut en bas pour la
// tonique, puis s'ouvrent un par un en partant du bas à mesure que la gamme majeure monte.
// Vérifié contre https://www.tinwhistletab.com/fr/finger-chart (doigtés en Ré).
const DIATONIC_CLOSED_HOLES: Record<number, number> = { 0: 6, 2: 5, 4: 4, 5: 3, 7: 2, 9: 1, 11: 0 };

const HAUT_OUVERT: HoleState[] = ["open", "closed", "closed", "closed", "closed", "closed"];

// Les deux altérations hors gamme les plus courantes ont un doigté réel non-adjacent
// (croisé ou demi-trou), vérifié sur tinwhistletab.com - pas dérivable d'une formule.
const CHROMATIC_FINGERINGS: Record<number, HoleState[]> = {
    3: ["closed", "closed", "closed", "closed", "half", "open"], // fa naturel, demi-trou
    10: ["open", "closed", "closed", "open", "open", "open"], // do naturel, doigté croisé
};

function closedCountPattern(closed: number): HoleState[] {
    return Array.from({ length: 6 }, (_, i) => (i < closed ? "closed" : "open"));
}

export function fingeringFor(semitoneFromTonic: number, octave: number): HoleState[] {
    const s = ((semitoneFromTonic % 12) + 12) % 12;
    // Le ré aigu (octave 2+ de la tonique) n'est pas le même doigté que le ré grave :
    // on entrouvre le trou du haut au lieu de garder les six trous fermés.
    if (s === 0 && octave >= 1) return HAUT_OUVERT;
    const closed = DIATONIC_CLOSED_HOLES[s];
    if (closed !== undefined) return closedCountPattern(closed);
    if (CHROMATIC_FINGERINGS[s]) return CHROMATIC_FINGERINGS[s];
    // ponytail: pour les altérations plus rares (ré#, sol#, la#), le doigté croisé réel
    // varie selon le whistle et ne fait pas consensus -> approximation par demi-trou.
    const lowerDegree = Math.max(
        ...Object.keys(DIATONIC_CLOSED_HOLES).map(Number).filter((d) => d < s)
    );
    const k = DIATONIC_CLOSED_HOLES[lowerDegree];
    return Array.from({ length: 6 }, (_, i) => (i < k - 1 ? "closed" : i === k - 1 ? "half" : "open"));
}

// Octave 1 = doigtés de base (pas de marque), octave 2 = "+", octave 3 = "++" (souffle plus
// soutenu, même doigté). Ancré sur l'octave du whistle en Ré (fondamentale Ré4) ; pour les
// autres tonalités on rapproche la fondamentale du même registre (même famille d'instrument).
export function fundamentalMidi(tonicPitchClass: number): number {
    let f = 60 + tonicPitchClass;
    if (f - 62 > 6) f -= 12;
    return f;
}

const WHISTLE_INSTRUMENTS: WindInstrument[] = FLUTE_KEYS.map((k) => ({
    id: `whistle-${k.value}`,
    label: `Tin whistle en ${k.label}`,
    tonicPitchClass: k.pitchClass,
    fundamentalMidi: fundamentalMidi(k.pitchClass),
    fingeringFor,
}));

export const INSTRUMENTS: WindInstrument[] = [...WHISTLE_INSTRUMENTS, ...RECORDER_INSTRUMENTS];

export function getInstrument(id: string): WindInstrument {
    return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];
}

export function breathMarker(octave: number): string {
    if (octave <= 0) return "";
    return octave === 1 ? "+" : "++";
}

const SOLFEGE: Record<string, string> = {
    C: "Do", Db: "Réb", D: "Ré", Eb: "Mib", E: "Mi", F: "Fa",
    Gb: "Solb", G: "Sol", Ab: "Lab", A: "La", Bb: "Sib", B: "Si",
};

export function toSolfege(baseLabel: string): string {
    return SOLFEGE[baseLabel.replace(/\d+$/, "")] ?? baseLabel;
}

function FingeringDiagram({ pattern }: { pattern: HoleState[] }) {
    const id = useId();
    const r = 7;
    const gap = 3;
    const size = r * 2;
    const height = pattern.length * (size + gap) - gap;

    return (
        <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
            {pattern.map((state, i) => {
                const cy = i * (size + gap) + r;
                const clipId = `${id}-h${i}`;
                return (
                    <g key={i}>
                        {state === "half" && (
                            <clipPath id={clipId}>
                                <rect x={0} y={cy} width={size} height={r} />
                            </clipPath>
                        )}
                        <circle cx={r} cy={cy} r={r - 1.2} fill="none" stroke="currentColor" strokeWidth={1.3} />
                        {state === "closed" && <circle cx={r} cy={cy} r={r - 1.2} fill="currentColor" />}
                        {state === "half" && (
                            <circle cx={r} cy={cy} r={r - 1.2} fill="currentColor" clipPath={`url(#${clipId})`} />
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

export interface TabNote {
    key: string; // identifiant React (unique, même pour une note rejouée via un signe de reprise)
    domKey: string; // identifiant utilisé par le lecteur pour cibler la note en cours de lecture
    label: string;
    solfegeLabel: string;
    pattern: HoleState[];
    newMeasure: boolean;
    highOctave: boolean; // octave 2+ (marqueur +/++) : mise en couleur pour repérage rapide
    midiPitch: number;
    startMs?: number; // lecture pilotée par minuterie (import MIDI) plutôt que par le cursorControl abcjs
    endMs?: number;
}

function buildTabNote(pitch: number, instrument: WindInstrument, domKey: string, index: number, newMeasure: boolean): TabNote {
    const octave = Math.floor((pitch - instrument.fundamentalMidi) / 12);
    const baseLabel = ABCJS.synth.pitchToNoteName[pitch] || String(pitch);
    return {
        // domKey seul n'est pas toujours unique (ex. reprise ABC qui rejoue les mêmes startChar/endChar).
        key: `${domKey}#${index}`,
        domKey,
        label: `${baseLabel}${breathMarker(octave)}`,
        solfegeLabel: `${toSolfege(baseLabel)}${breathMarker(octave)}`,
        pattern: instrument.fingeringFor(pitch - instrument.tonicPitchClass, octave),
        newMeasure,
        highOctave: octave > 0,
        midiPitch: pitch,
    };
}

// setUpAudio() n'est pas exposé par les types abcjs au-delà de sa signature ; on relit
// directement les événements qu'il calcule (déjà utilisés en interne pour la lecture audio)
// plutôt que de recalculer nous-mêmes les hauteurs de notes (clé, altérations, transposition...).
interface AudioNoteEvent {
    cmd: string;
    pitch: number;
    start: number;
    startChar: number;
    endChar: number;
}

export function extractNotesFromAbc(visualObj: TuneObjectArray, abcSource: string, instrument: WindInstrument): TabNote[] {
    const audio = visualObj[0].setUpAudio({}) as unknown as { tracks: AudioNoteEvent[][] };
    const events = (audio.tracks?.[0] || []).filter((e) => e && e.cmd === "note" && typeof e.pitch === "number");

    const notes: TabNote[] = [];
    let lastStart: number | null = null;
    let prevEndChar = 0;
    events.forEach((e) => {
        if (e.start === lastStart) return; // ponytail: ignore les notes empilées (accords/bourdon), on garde la première
        lastStart = e.start;
        const pitch = Math.round(e.pitch);
        const newMeasure = notes.length > 0 && /\|/.test(abcSource.slice(prevEndChar, e.startChar));
        prevEndChar = e.endChar;
        const domKey = `${e.startChar}-${e.endChar}`;
        notes.push(buildTabNote(pitch, instrument, domKey, notes.length, newMeasure));
    });
    return notes;
}

export interface MidiNoteEvent {
    pitch: number; // numéro de note MIDI (ex. 60 = Do4)
    startMs: number;
    endMs: number;
}

export function extractNotesFromMidi(events: MidiNoteEvent[], instrument: WindInstrument): TabNote[] {
    const sorted = [...events].sort((a, b) => a.startMs - b.startMs);
    const notes: TabNote[] = [];
    let lastStart: number | null = null;
    sorted.forEach((e) => {
        if (e.startMs === lastStart) return; // ponytail: ignore les notes empilées (accords), on garde la première
        lastStart = e.startMs;
        const domKey = String(notes.length);
        const note = buildTabNote(Math.round(e.pitch), instrument, domKey, notes.length, false);
        note.startMs = e.startMs;
        note.endMs = e.endMs;
        notes.push(note);
    });
    return notes;
}

interface FluteTablatureProps {
    notes: TabNote[];
    instrumentId: string;
    onInstrumentChange: (id: string) => void;
}

const FluteTablature = ({ notes, instrumentId, onInstrumentChange }: FluteTablatureProps) => {
    return (
        <Stack spacing={1}>
            <Select
                size="small"
                value={instrumentId}
                onChange={(e: SelectChangeEvent) => onInstrumentChange(e.target.value)}
                sx={{ width: 280, maxWidth: '100%' }}
            >
                {INSTRUMENTS.map((instrument) => (
                    <MenuItem key={instrument.id} value={instrument.id}>
                        {instrument.label}
                    </MenuItem>
                ))}
            </Select>

            <Stack direction="row" flexWrap="wrap" alignItems="flex-start" gap={1.5} color="text.primary" sx={{ py: 1 }}>
                {notes.map((note) => (
                    <Box
                        key={note.key}
                        sx={note.newMeasure ? { borderLeft: "1px solid", borderColor: "divider", pl: 1.5 } : undefined}
                    >
                        <Stack
                            alignItems="center"
                            spacing={0.5}
                            data-note-key={note.domKey}
                            className={note.highOctave ? "flute-tab-octave" : undefined}
                        >
                            <FingeringDiagram pattern={note.pattern} />
                            <Typography variant="caption">{note.label}</Typography>
                            <Typography variant="caption" color={note.highOctave ? undefined : "text.secondary"}>
                                {note.solfegeLabel}
                            </Typography>
                        </Stack>
                    </Box>
                ))}
            </Stack>

            <Typography variant="caption" color="text.secondary">
                ● trou fermé · ○ trou ouvert · ◐ demi-trou · <Box component="span" className="flute-tab-octave">+ / ++</Box> seconde/troisième octave (même position de base, registre aigu)
            </Typography>
        </Stack>
    );
};

export default FluteTablature;
