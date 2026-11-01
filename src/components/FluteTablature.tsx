import { useId, useMemo } from "react";
import { Box, MenuItem, Select, SelectChangeEvent, Stack, Typography } from "@mui/material";
import ABCJS, { TuneObjectArray } from "abcjs";

export type FluteKey = "D" | "G" | "C" | "Bb" | "A";

export const FLUTE_KEYS: { value: FluteKey; label: string; pitchClass: number }[] = [
    { value: "D", label: "Ré", pitchClass: 2 },
    { value: "G", label: "Sol", pitchClass: 7 },
    { value: "C", label: "Do", pitchClass: 0 },
    { value: "Bb", label: "Sib", pitchClass: 10 },
    { value: "A", label: "La", pitchClass: 9 },
];

type HoleState = "closed" | "half" | "open";

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

function fingeringFor(semitoneFromTonic: number, octave: number): HoleState[] {
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
function fundamentalMidi(tonicPitchClass: number): number {
    let f = 60 + tonicPitchClass;
    if (f - 62 > 6) f -= 12;
    return f;
}

function breathMarker(octave: number): string {
    if (octave <= 0) return "";
    return octave === 1 ? "+" : "++";
}

const SOLFEGE: Record<string, string> = {
    C: "Do", Db: "Réb", D: "Ré", Eb: "Mib", E: "Mi", F: "Fa",
    Gb: "Solb", G: "Sol", Ab: "Lab", A: "La", Bb: "Sib", B: "Si",
};

function toSolfege(baseLabel: string): string {
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

interface TabNote {
    key: string; // identifiant React (unique, même pour une note rejouée via un signe de reprise)
    domKey: string; // startChar-endChar : utilisé par Music.tsx pour cibler la note en cours de lecture
    label: string;
    solfegeLabel: string;
    pattern: HoleState[];
    newMeasure: boolean;
    highOctave: boolean; // octave 2+ (marqueur +/++) : mise en couleur pour repérage rapide
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

function extractNotes(visualObj: TuneObjectArray, abcSource: string, tonicPitchClass: number): TabNote[] {
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
        const octave = Math.floor((pitch - fundamentalMidi(tonicPitchClass)) / 12);
        const baseLabel = ABCJS.synth.pitchToNoteName[pitch] || String(pitch);
        notes.push({
            // domKey seul n'est pas unique : un signe de reprise rejoue les mêmes startChar/endChar.
            key: `${domKey}#${notes.length}`,
            domKey,
            label: `${baseLabel}${breathMarker(octave)}`,
            solfegeLabel: `${toSolfege(baseLabel)}${breathMarker(octave)}`,
            pattern: fingeringFor(pitch - tonicPitchClass, octave),
            newMeasure,
            highOctave: octave > 0,
        });
    });
    return notes;
}

interface FluteTablatureProps {
    visualObj: TuneObjectArray;
    abcSource: string;
    fluteKey: FluteKey;
    onFluteKeyChange: (key: FluteKey) => void;
}

const FluteTablature = ({ visualObj, abcSource, fluteKey, onFluteKeyChange }: FluteTablatureProps) => {
    const tonicPitchClass = FLUTE_KEYS.find((k) => k.value === fluteKey)?.pitchClass ?? 2;
    const notes = useMemo(
        () => extractNotes(visualObj, abcSource, tonicPitchClass),
        [visualObj, abcSource, tonicPitchClass]
    );

    return (
        <Stack spacing={1}>
            <Select
                size="small"
                value={fluteKey}
                onChange={(e: SelectChangeEvent) => onFluteKeyChange(e.target.value as FluteKey)}
                sx={{ width: 160 }}
            >
                {FLUTE_KEYS.map((k) => (
                    <MenuItem key={k.value} value={k.value}>
                        Flûte en {k.label}
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
                ● trou fermé · ○ trou ouvert · ◐ demi-trou · <Box component="span" className="flute-tab-octave">+ / ++</Box> seconde/troisième octave (même doigté, souffle plus soutenu)
            </Typography>
        </Stack>
    );
};

export default FluteTablature;
