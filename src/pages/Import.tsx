import { ChangeEvent, useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Midi } from "@tonejs/midi";
import MusicPlayer from "../components/MusicPlayer";
import MidiFlutePlayer from "../components/MidiFlutePlayer";
import { MidiNoteEvent } from "../components/FluteTablature";

type Loaded =
    | { kind: "abc"; title: string; text: string }
    | { kind: "midi"; title: string; events: MidiNoteEvent[]; durationMs: number };

const titleFromAbc = (text: string, fallback: string) => {
    const match = text.match(/^T:\s*(.+)$/m);
    return match ? match[1].trim() : fallback;
};

const Import = () => {
    const [loaded, setLoaded] = useState<Loaded | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAbcFile = async (file: File) => {
        const text = await file.text();
        if (!/^X:/m.test(text)) {
            setError("Ce fichier ne ressemble pas à une notation ABC valide (pas d'en-tête \"X:\").");
            return;
        }
        setError(null);
        setLoaded({ kind: "abc", title: titleFromAbc(text, file.name.replace(/\.abc$/i, "")), text });
    };

    const handleMidiFile = async (file: File) => {
        try {
            const buffer = await file.arrayBuffer();
            const midi = new Midi(buffer);
            const events: MidiNoteEvent[] = midi.tracks.flatMap((track) =>
                track.notes.map((n) => ({ pitch: n.midi, startMs: n.time * 1000, endMs: (n.time + n.duration) * 1000 }))
            );
            if (events.length === 0) {
                setError("Ce fichier MIDI ne contient aucune note exploitable.");
                return;
            }
            setError(null);
            setLoaded({
                kind: "midi",
                title: midi.header.name || file.name.replace(/\.midi?$/i, ""),
                events,
                durationMs: midi.duration * 1000,
            });
        } catch {
            setError("Impossible de lire ce fichier MIDI.");
        }
    };

    const onAbcInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) handleAbcFile(file);
    };

    const onMidiInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) handleMidiFile(file);
    };

    if (loaded?.kind === "abc") {
        return (
            <Stack spacing={2}>
                <Button variant="outlined" size="small" onClick={() => setLoaded(null)} sx={{ alignSelf: 'flex-start' }}>
                    ← Charger un autre fichier
                </Button>
                <MusicPlayer title={loaded.title} notations={loaded.text} />
            </Stack>
        );
    }

    if (loaded?.kind === "midi") {
        return (
            <Stack spacing={2}>
                <Button variant="outlined" size="small" onClick={() => setLoaded(null)} sx={{ alignSelf: 'flex-start' }}>
                    ← Charger un autre fichier
                </Button>
                <MidiFlutePlayer title={loaded.title} events={loaded.events} durationMs={loaded.durationMs} />
            </Stack>
        );
    }

    return (
        <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
            <Typography variant="h4">Importer un fichier</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480 }}>
                Charge un fichier .abc ou .mid/.midi depuis ton appareil pour voir sa tablature flûte
                irlandaise et t'en servir pour t'entraîner — sans l'ajouter au catalogue de l'application.
                Rien n'est envoyé nulle part : le fichier reste sur ton appareil.
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
                <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
                    Fichier ABC
                    <input type="file" accept=".abc,text/plain" hidden onChange={onAbcInputChange} />
                </Button>
                <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
                    Fichier MIDI
                    <input type="file" accept=".mid,.midi,audio/midi,audio/x-midi" hidden onChange={onMidiInputChange} />
                </Button>
            </Stack>
            {error && <Alert severity="error" sx={{ maxWidth: 480 }}>{error}</Alert>}
            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 480 }}>
                Import MIDI : tablature et lecture simple uniquement (pas de partition ni de boucle d'apprentissage par mesure).
            </Typography>
        </Stack>
    );
};

export default Import;
