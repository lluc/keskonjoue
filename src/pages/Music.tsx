import { useParams } from "react-router-dom";
import { store } from "../service/store.service"
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { Slider } from "@mui/material";
import ABCJS, { TuneObjectArray } from 'abcjs'
import { useEffect, useLayoutEffect, useState, useRef } from "react";
import jsonNotations from "../data/notations.json";


const Music = () => {
    const { slug } = useParams();
    const data = store.getRow('music', slug || '')
    const [isPlaying, setIsPlaying] = useState(false);
    const notations = jsonNotations["abcFiles"][data.notation as keyof typeof jsonNotations["abcFiles"]] as string;
    const midiBufferRef = useRef(new ABCJS.synth.CreateSynth());
    const [visualObj, setVisualObj] = useState<null | TuneObjectArray>(null);
    const [warp, setWarp] = useState(100); // Pourcentage du tempo (100 = normal)
    const warpRef = useRef(warp); // Ref pour accéder à la valeur actuelle dans les callbacks

    useLayoutEffect(() => {
        if (notations === undefined) {
            return
        }

        const visualObj = ( ABCJS.renderAbc("paper", notations, {
            responsive: "resize",
            scrollHorizontal: true,   
        }
        ))

        setVisualObj(visualObj)

    }, [])

    useEffect(() => {
        return () => {
            midiBufferRef.current.stop();
        };
    }, []);

    // Synchroniser warpRef avec warp
    useEffect(() => {
        warpRef.current = warp;
    }, [warp]);

    const startPlayback = () => {
        if (visualObj === null) return;

        const midiBuffer = midiBufferRef.current;
        midiBuffer.init({
            audioContext: new AudioContext(),
            visualObj: visualObj[0],
            millisecondsPerMeasure: visualObj[0].millisecondsPerMeasure() * (100 / warpRef.current),
            options: {}
        }).then(() => {
            return midiBuffer.prime();
        }).then(() => {
            midiBuffer.start();
            setIsPlaying(true);
        }).catch((error) => {
            console.warn("Audio problem:", error);
        });
    };

    const togglePlayMusic = () => {
        if (isPlaying) {
            midiBufferRef.current.stop();
            setIsPlaying(false);
        } else {
            startPlayback();
        }
    };

    // Handler for tempo/warp change - redémarre la lecture si en cours
    const handleWarpChange = (_event: Event, newValue: number | number[]) => {
        if (Array.isArray(newValue)) return;
        setWarp(newValue);
        warpRef.current = newValue;

        // Si en lecture, redémarrer avec le nouveau tempo
        if (isPlaying) {
            midiBufferRef.current.stop();
            // Petit délai pour permettre l'arrêt complet
            setTimeout(() => startPlayback(), 50);
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
                    <Box>
                        <Button variant="contained" onClick={togglePlayMusic}>
                            {isPlaying ? 'Arrêter' : 'Jouer'}
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

                    <Box
                        id="paper"
                    />
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
