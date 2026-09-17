import { useParams } from "react-router-dom";
import { store } from "../service/store.service"
import { Box, Button, Divider, Stack, Tab, Tabs, Typography } from "@mui/material";
import { Slider } from "@mui/material";
import ABCJS, { TuneObjectArray, SynthObjectController, CursorControl, NoteTimingEvent } from 'abcjs'
import { useEffect, useLayoutEffect, useState, useRef } from "react";
import jsonNotations from "../data/notations.json";
import FluteTablature, { FluteKey } from "../components/FluteTablature";
import 'abcjs/abcjs-audio.css';


const Music = () => {
    const { slug } = useParams();
    const data = store.getRow('music', slug || '')
    const [isPlaying, setIsPlaying] = useState(false);
    const notations = jsonNotations["abcFiles"][data.notation as keyof typeof jsonNotations["abcFiles"]] as string;
    const synthControlRef = useRef<SynthObjectController | null>(null);
    const [visualObj, setVisualObj] = useState<null | TuneObjectArray>(null);
    const [warp, setWarp] = useState(100);
    const [isReady, setIsReady] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [fluteKey, setFluteKey] = useState<FluteKey>("D");

    useLayoutEffect(() => {
        if (notations === undefined) {
            return
        }

        const visualObj = ABCJS.renderAbc("paper", notations, {
            responsive: "resize",
            scrollHorizontal: true,
        });

        setVisualObj(visualObj);

    }, [])

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
                });
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

        if (isPlaying) {
            synthControlRef.current.pause();
            setIsPlaying(false);
        } else {
            synthControlRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleWarpChange = (_event: Event, newValue: number | number[]) => {
        if (Array.isArray(newValue)) return;
        setWarp(newValue);

        if (synthControlRef.current) {
            synthControlRef.current.setWarp(newValue);
        }
    };

    return (
        <Stack spacing={2}>
            <Typography variant="h3">
                {data.name}

                {data.rights == 1 &&
                    <Typography variant="body1" color="red">
                        © {data.authors}
                    </Typography>
                }
            </Typography>
            {notations &&
                <Stack>
                    <Box id="audio-control" sx={{ display: 'none' }} />
                    <Box>
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

                    <Tabs value={activeTab} onChange={(_event, newValue) => setActiveTab(newValue)}>
                        <Tab label="Partition" />
                        <Tab label="Tablature flûte irlandaise" />
                    </Tabs>

                    <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
                        <Box id="paper" />
                    </Box>

                    {activeTab === 1 && visualObj &&
                        <FluteTablature
                            visualObj={visualObj}
                            abcSource={notations}
                            fluteKey={fluteKey}
                            onFluteKeyChange={setFluteKey}
                        />
                    }
                </Stack>
            }
            {data.youtube &&
                <Stack spacing={2}>
                    <Divider />
                    <Typography variant="h5">
                        Vidéo
                    </Typography>
                    <Box
                        component="iframe"
                        src={`https://www.youtube-nocookie.com/embed/${data.youtube}`}
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

export default Music
