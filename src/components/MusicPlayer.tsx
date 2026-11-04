import { Box, Button, Divider, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { Slider } from "@mui/material";
import ABCJS, { TuneObjectArray, SynthObjectController, CursorControl, NoteTimingEvent } from 'abcjs'
import { useEffect, useLayoutEffect, useMemo, useState, useRef } from "react";
import FluteTablature, { extractNotesFromAbc, getInstrument, INSTRUMENTS } from "./FluteTablature";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import AirIcon from "@mui/icons-material/Air";
import SchoolIcon from "@mui/icons-material/School";
import 'abcjs/abcjs-audio.css';

interface MusicPlayerProps {
    title: string;
    copyrightNotice?: string;
    youtubeId?: string;
    notations?: string;
}

const MusicPlayer = ({ title, copyrightNotice, youtubeId, notations }: MusicPlayerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const synthControlRef = useRef<SynthObjectController | null>(null);
    const [visualObj, setVisualObj] = useState<null | TuneObjectArray>(null);
    const [warp, setWarp] = useState(100);
    const [isReady, setIsReady] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [instrumentId, setInstrumentId] = useState<string>(INSTRUMENTS[0].id);
    const tabNotes = useMemo(
        () => (visualObj && notations ? extractNotesFromAbc(visualObj, notations, getInstrument(instrumentId)) : []),
        [visualObj, notations, instrumentId]
    );
    const [learnRange, setLearnRange] = useState<[number, number]>([1, 1]);
    const [totalMeasures, setTotalMeasures] = useState(0);
    const measureStartsRef = useRef<number[]>([]); // ms du début de chaque mesure, indexé par numéro de mesure
    const loopInfoRef = useRef<{ enabled: boolean; startPercent: number; endMeasure: number }>({
        enabled: false,
        startPercent: 0,
        endMeasure: Infinity,
    });

    useLayoutEffect(() => {
        if (notations === undefined) {
            return
        }

        const visualObj = ABCJS.renderAbc("paper", notations, {
            responsive: "resize",
            scrollHorizontal: true,
        });

        setVisualObj(visualObj);

        // Numéro et ms de début de chaque mesure, pour la boucle d'apprentissage.
        // setTiming() n'a besoin que du rendu (pas de lecture audio) pour fonctionner.
        visualObj[0].setTiming(visualObj[0].getBpm());
        const timings = (visualObj[0] as unknown as { noteTimings?: NoteTimingEvent[] }).noteTimings || [];
        const starts: number[] = [];
        let total = 0;
        timings.forEach((t) => {
            if (t.measureNumber === undefined || t.milliseconds === undefined) return;
            if (starts[t.measureNumber] === undefined || t.milliseconds < starts[t.measureNumber]) {
                starts[t.measureNumber] = t.milliseconds;
            }
            if (t.measureNumber > total) total = t.measureNumber;
        });
        measureStartsRef.current = starts;
        setTotalMeasures(total);
        setLearnRange([1, Math.max(1, total)]);

    }, [notations])

    useEffect(() => {
        if (visualObj === null || notations === undefined) return;

        const synthControl = new ABCJS.synth.SynthController();
        synthControlRef.current = synthControl;

        const cursorControl: CursorControl = {
            onEvent: (event: NoteTimingEvent) => {
                // Retirer le surlignage des notes précédentes
                const highlighted = document.querySelectorAll('.abcjs-note-playing');
                highlighted.forEach(el => el.classList.remove('abcjs-note-playing'));
                const tabHighlighted = document.querySelectorAll('.flute-tab-note-playing');
                tabHighlighted.forEach(el => el.classList.remove('flute-tab-note-playing'));

                // Surligner les notes actuelles
                if (event.elements) {
                    event.elements.forEach(elementArray => {
                        elementArray.forEach(el => {
                            el.classList.add('abcjs-note-playing');
                        });
                    });
                }

                // Surligner le doigté correspondant dans la tablature flûte
                const startChars = event.startCharArray || (event.startChar !== undefined ? [event.startChar] : []);
                const endChars = event.endCharArray || (event.endChar !== undefined ? [event.endChar] : []);
                startChars.forEach((startChar, i) => {
                    const el = document.querySelector(`[data-note-key="${startChar}-${endChars[i]}"]`);
                    el?.classList.add('flute-tab-note-playing');
                    // N'existe dans le DOM que si l'onglet Tablature est actif (rendu conditionnel).
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });

                // Boucle d'apprentissage : revenir au début de l'extrait sélectionné
                const loop = loopInfoRef.current;
                if (loop.enabled && event.measureNumber !== undefined && event.measureNumber > loop.endMeasure) {
                    seekTo(loop.startPercent);
                }
            },
            onFinished: () => {
                // Retirer tout surlignage à la fin
                const highlighted = document.querySelectorAll('.abcjs-note-playing');
                highlighted.forEach(el => el.classList.remove('abcjs-note-playing'));
                const tabHighlighted = document.querySelectorAll('.flute-tab-note-playing');
                tabHighlighted.forEach(el => el.classList.remove('flute-tab-note-playing'));
                setIsPlaying(false);
            }
        };

        synthControl.load("#audio-control", cursorControl, {
            displayLoop: false,
            displayRestart: false,
            displayPlay: false,
            displayProgress: false,
            displayWarp: true,
        });

        synthControl.setTune(visualObj[0], false, {
            qpm: visualObj[0].getBpm?.() || 120,
            soundFontUrl: '/soundfonts/FluidR3_GM',
        }).then(() => {
            setIsReady(true);
        }).catch((error: Error) => {
            console.warn("Audio problem:", error);
        });

        return () => {
            if (synthControlRef.current) {
                synthControlRef.current.pause();
            }
            // Nettoyer le surlignage au démontage
            const highlighted = document.querySelectorAll('.abcjs-note-playing');
            highlighted.forEach(el => el.classList.remove('abcjs-note-playing'));
            const tabHighlighted = document.querySelectorAll('.flute-tab-note-playing');
            tabHighlighted.forEach(el => el.classList.remove('flute-tab-note-playing'));
        };
    }, [visualObj, notations]);

    const togglePlayMusic = () => {
        if (!synthControlRef.current || !isReady) return;

        // synthControl.play() bascule déjà lecture/pause en interne (self.isStarted).
        // Appeler .pause() séparément désynchronisait cet état interne du nôtre : au bout
        // de quelques allers-retours, "Jouer" retombait sur la branche pause sans jouer de son.
        synthControlRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const handleWarpChange = (_event: Event, newValue: number | number[]) => {
        if (Array.isArray(newValue)) return;
        setWarp(newValue);
    };

    const handleWarpCommitted = (_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
        if (Array.isArray(newValue)) return;
        // setWarp() reconstruit le moteur audio d'abcjs : ne l'appeler qu'une fois au
        // relâchement, sinon chaque pixel glissé déclenche une reconstruction qui se
        // chevauche avec la précédente (lecture qui s'emballe pendant le glissement).
        if (synthControlRef.current) {
            synthControlRef.current.setWarp(newValue);
        }
    };

    const seekTo = (percent: number) => {
        (synthControlRef.current as unknown as { seek?: (percent: number) => void })?.seek?.(percent);
    };

    const updateLoopInfo = (enabled: boolean, range: [number, number]) => {
        const totalTimeMs = (visualObj?.[0].getTotalTime() || 0) * 1000;
        const startMs = measureStartsRef.current[range[0]] || 0;
        loopInfoRef.current = {
            enabled,
            startPercent: totalTimeMs > 0 ? startMs / totalTimeMs : 0,
            endMeasure: range[1],
        };
        if (enabled) seekTo(loopInfoRef.current.startPercent);
    };

    const handleRangeCommitted = (range: [number, number]) => {
        setLearnRange(range);
        const isSubRange = range[0] > 1 || range[1] < totalMeasures;
        updateLoopInfo(isSubRange, range);
    };

    const handleMeasureFieldChange = (which: 0 | 1, value: number) => {
        if (!Number.isFinite(value)) return;
        const clamped = Math.min(Math.max(Math.round(value), 1), Math.max(totalMeasures, 1));
        const range: [number, number] = which === 0
            ? [clamped, Math.max(clamped, learnRange[1])]
            : [Math.min(learnRange[0], clamped), clamped];
        handleRangeCommitted(range);
    };

    return (
        <Stack spacing={2}>
            <Typography variant="h3">
                {title}

                {copyrightNotice &&
                    <Typography variant="body1" color="red">
                        {copyrightNotice}
                    </Typography>
                }
            </Typography>
            {notations &&
                <Stack>
                    <Box id="audio-control" sx={{ display: 'none' }} />
                    <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.default', py: 1 }}>
                        <Button variant="contained" onClick={togglePlayMusic} disabled={!isReady}>
                            {isPlaying ? 'Pause' : 'Jouer'}
                        </Button>
                    </Box>
                    <Box>
                        <Typography id="warp-slider" gutterBottom>
                            Vitesse: {warp}%
                        </Typography>
                        <Slider
                            value={warp}
                            onChange={handleWarpChange}
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

                    <Tabs
                        value={activeTab}
                        onChange={(_event, newValue) => setActiveTab(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                    >
                        <Tab icon={<MusicNoteIcon />} iconPosition="start" label="Partition" />
                        <Tab icon={<AirIcon />} iconPosition="start" label="Tablature" />
                        <Tab icon={<SchoolIcon />} iconPosition="start" label="Apprentissage" />
                    </Tabs>

                    <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
                        <Box id="paper" />
                    </Box>

                    {activeTab === 1 && visualObj &&
                        <FluteTablature
                            notes={tabNotes}
                            instrumentId={instrumentId}
                            onInstrumentChange={setInstrumentId}
                        />
                    }

                    {activeTab === 2 &&
                        <Stack spacing={2} sx={{ py: 1 }}>
                            <Box>
                                <Typography gutterBottom>
                                    Mesures {learnRange[0]} à {learnRange[1]}{totalMeasures ? ` (sur ${totalMeasures})` : ''}
                                </Typography>
                                <Slider
                                    value={learnRange}
                                    onChange={(_e, v) => Array.isArray(v) && setLearnRange(v as [number, number])}
                                    onChangeCommitted={(_e, v) => handleRangeCommitted(v as [number, number])}
                                    min={1}
                                    max={Math.max(totalMeasures, 1)}
                                    step={1}
                                    valueLabelDisplay="auto"
                                    disabled={totalMeasures === 0}
                                />
                            </Box>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Mesure de début"
                                    type="number"
                                    size="small"
                                    value={learnRange[0]}
                                    onChange={(e) => handleMeasureFieldChange(0, Number(e.target.value))}
                                    disabled={totalMeasures === 0}
                                    inputProps={{ min: 1, max: Math.max(totalMeasures, 1) }}
                                    sx={{ width: 150 }}
                                />
                                <TextField
                                    label="Mesure de fin"
                                    type="number"
                                    size="small"
                                    value={learnRange[1]}
                                    onChange={(e) => handleMeasureFieldChange(1, Number(e.target.value))}
                                    disabled={totalMeasures === 0}
                                    inputProps={{ min: 1, max: Math.max(totalMeasures, 1) }}
                                    sx={{ width: 150 }}
                                />
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                                {totalMeasures === 0
                                    ? "Chargement du morceau..."
                                    : learnRange[0] > 1 || learnRange[1] < totalMeasures
                                        ? "Cet extrait est joué en boucle : utilisez le bouton Jouer ci-dessus."
                                        : "Réduisez la plage pour boucler un extrait, puis utilisez le bouton Jouer ci-dessus."}
                            </Typography>
                        </Stack>
                    }
                </Stack>
            }
            {youtubeId &&
                <Stack spacing={2}>
                    <Divider />
                    <Typography variant="h5">
                        Vidéo
                    </Typography>
                    <Box
                        component="iframe"
                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                        width="100%"
                        height={300}
                        sx={{ border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                    />
                </Stack>
            }
        </Stack>
    )
}

export default MusicPlayer
