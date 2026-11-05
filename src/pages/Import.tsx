import { ChangeEvent, useState } from "react";
import { Alert, Box, Button, Link, Stack, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import ABCJS from "abcjs";
import { Midi } from "@tonejs/midi";
import MusicPlayer from "../components/MusicPlayer";
import MidiFlutePlayer from "../components/MidiFlutePlayer";
import { MidiNoteEvent } from "../components/FluteTablature";

interface AbcVideoRef {
    id: string; // identifiant YouTube (11 caractères alphanumériques, cf. regex ci-dessous)
    url: string; // URL d'origine telle que trouvée dans le fichier, affichée avant tout chargement
}

type Loaded =
    | { kind: "abc"; title: string; text: string; notice?: string; video?: AbcVideoRef }
    | { kind: "midi"; title: string; events: MidiNoteEvent[]; durationMs: number };

const titleFromAbc = (text: string, fallback: string) => {
    const match = text.match(/^T:\s*(.+)$/m);
    return match ? match[1].trim() : fallback;
};

// Certains fichiers ABC référencent une vidéo (souvent via %%text) sous forme de simple texte,
// affiché tel quel par abcjs dans la partition - sans lien cliquable. On en extrait l'identifiant
// pour pouvoir l'afficher en vidéo intégrée - mais un fichier importé n'est pas une source de
// confiance (contrairement au catalogue) : on ne charge jamais ce contenu externe automatiquement,
// cf. le bouton de confirmation dans l'écran du lecteur ABC.
function videoRefFromAbc(text: string): AbcVideoRef | undefined {
    const urls = text.match(/https?:\/\/\S+/g) || [];
    for (const url of urls) {
        const idMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        if (idMatch) return { id: idMatch[1], url };
    }
    return undefined;
}

// Vrai si le morceau contient au moins une note jouable une fois analysé (indépendamment de
// tout rendu DOM : parseOnly() fait juste l'analyse syntaxique, sans l'afficher).
function abcHasNotes(text: string): boolean {
    try {
        const tune = ABCJS.parseOnly(text)[0];
        const audio = tune?.setUpAudio({}) as unknown as { tracks?: { cmd: string }[][] };
        return !!audio?.tracks?.some((track) => track.some((e) => e?.cmd === "note"));
    } catch {
        return false;
    }
}

// Certains fichiers ABC glanés sur le web ont leurs lignes de musique entièrement mises en
// commentaire (chaque ligne du corps du morceau préfixée par "%"), souvent parce que la
// transcription n'était pas confirmée par son auteur. On ne décommente que le corps (après
// l'en-tête, jusqu'à la ligne K:), et seulement les lignes à simple "%" (pas "%%", qui est une
// directive ABC valide, pas un commentaire) - pour ne pas toucher aux champs d'en-tête.
function uncommentMusicBody(text: string): string {
    const lines = text.split("\n");
    const keyLineIndex = lines.findIndex((line) => /^K:/.test(line.trim()));
    if (keyLineIndex === -1) return text;
    return lines
        .map((line, i) => {
            if (i <= keyLineIndex) return line;
            const match = line.match(/^%(?!%)\s?(.*)$/);
            return match ? match[1] : line;
        })
        .join("\n");
}

const Import = () => {
    const [loaded, setLoaded] = useState<Loaded | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [videoConsent, setVideoConsent] = useState(false);

    const handleAbcFile = async (file: File) => {
        const text = await file.text();
        if (!/^X:/m.test(text)) {
            setError("Ce fichier ne ressemble pas à une notation ABC valide (pas d'en-tête \"X:\").");
            return;
        }

        let finalText = text;
        let notice: string | undefined;
        if (!abcHasNotes(text)) {
            const uncommented = uncommentMusicBody(text);
            if (uncommented !== text && abcHasNotes(uncommented)) {
                finalText = uncommented;
                notice = "Les lignes de musique de ce fichier étaient en commentaire (aucune note jouable) : elles ont été décommentées automatiquement. Vérifie le résultat avant de t'y fier.";
            } else {
                setError("Ce fichier ABC est valide mais ne contient aucune note jouable (le corps du morceau semble vide ou entièrement en commentaire).");
                return;
            }
        }

        setError(null);
        setVideoConsent(false);
        setLoaded({
            kind: "abc",
            title: titleFromAbc(finalText, file.name.replace(/\.abc$/i, "")),
            text: finalText,
            notice,
            video: videoRefFromAbc(finalText),
        });
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
                {loaded.notice && <Alert severity="info">{loaded.notice}</Alert>}
                <MusicPlayer title={loaded.title} notations={loaded.text} />
                {loaded.video && (
                    <Box sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                            Vidéo référencée dans le fichier : <Link href={loaded.video.url} target="_blank" rel="noopener noreferrer">{loaded.video.url}</Link>
                        </Typography>
                        {videoConsent ? (
                            <Box
                                component="iframe"
                                src={`https://www.youtube-nocookie.com/embed/${loaded.video.id}`}
                                width="100%"
                                height={300}
                                sx={{ border: 0, mt: 1 }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                loading="lazy"
                            />
                        ) : (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<OndemandVideoIcon />}
                                onClick={() => setVideoConsent(true)}
                                sx={{ mt: 1 }}
                            >
                                Charger la vidéo ici
                            </Button>
                        )}
                    </Box>
                )}
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
