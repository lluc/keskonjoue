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
const DIATONIC_CLOSED_HOLES: Record<number, number> = { 0: 6, 2: 5, 4: 4, 5: 3, 7: 2, 9: 1, 11: 0 };

function fingeringFor(semitoneFromTonic: number): HoleState[] {
    const s = ((semitoneFromTonic % 12) + 12) % 12;
    const closed = DIATONIC_CLOSED_HOLES[s];
    if (closed !== undefined) {
        return Array.from({ length: 6 }, (_, i) => (i < closed ? "closed" : "open"));
    }
    // ponytail: note chromatique hors gamme -> approximée par un demi-trou entre les deux
    // degrés voisins (convention générale du "half-holing"), pas un doigté croisé spécifique.
    const lowerDegree = Math.max(
        ...Object.keys(DIATONIC_CLOSED_HOLES).map(Number).filter((d) => d < s)
    );
    const k = DIATONIC_CLOSED_HOLES[lowerDegree];
    return Array.from({ length: 6 }, (_, i) => (i < k - 1 ? "closed" : i === k - 1 ? "half" : "open"));
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
    key: string;
    label: string;
    pattern: HoleState[];
    newMeasure: boolean;
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
        notes.push({
            key: `${e.startChar}-${e.endChar}`,
            label: ABCJS.synth.pitchToNoteName[pitch] || String(pitch),
            pattern: fingeringFor(pitch - tonicPitchClass),
            newMeasure,
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
                        <Stack alignItems="center" spacing={0.5} data-note-key={note.key}>
                            <FingeringDiagram pattern={note.pattern} />
                            <Typography variant="caption">{note.label}</Typography>
                        </Stack>
                    </Box>
                ))}
            </Stack>

            <Typography variant="caption" color="text.secondary">
                ● trou fermé · ○ trou ouvert · ◐ demi-trou (note chromatique, doigté approximatif)
            </Typography>
        </Stack>
    );
};

export default FluteTablature;
