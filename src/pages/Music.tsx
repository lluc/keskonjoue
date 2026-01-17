import { useParams } from "react-router-dom";
import { store } from "../service/store.service"
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { Slider } from "@mui/material";
import ABCJS, { TuneObjectArray } from 'abcjs'
import { useEffect, useLayoutEffect, useState } from "react";
import jsonNotations from "../data/notations.json";


const Music = () => {
    const { slug } = useParams();
    const data = store.getRow('music', slug || '')
    // Ajouter un nouvel état pour le bouton à bascule
    const [isPlaying, setIsPlaying] = useState(false);
    const notations = jsonNotations["abcFiles"][data.notation as keyof typeof jsonNotations["abcFiles"]] as string;
    const [midiBuffer, setMidiBuffer] = useState( new ABCJS.synth.CreateSynth())
    const [visualObj, setVisualObj] = useState<null | TuneObjectArray>(null);
    // State for the tempo
    const [tempo, setTempo] = useState(visualObj ? visualObj[0].getBpm() : 120);

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
            // This will be called when the component is about to unmount
            // Stop the music
            midiBuffer.stop();

        };
    }, []); 


    const togglePlayMusic = () => {
        if (isPlaying) {
            midiBuffer.stop();
        } else {

            if (visualObj === null) {
                return
            }

            midiBuffer.init({
                audioContext: new AudioContext(),
                visualObj: visualObj[0],
                //sequence: [],
                millisecondsPerMeasure: visualObj[0].millisecondsPerMeasure(),
                // debugCallback: function(message) { console.log(message) },
                options: {
                    // soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/" ,
                    // sequenceCallback: function(noteMapTracks, callbackContext) { return noteMapTracks; },
                    // callbackContext: this,
                    // onEnded: function(callbackContext),
                    // pan: [ -0.5, 0.5 ]
                }
            }).then(function (response) {
                return midiBuffer.prime();
            }).then(function (response) {
                midiBuffer.start();
                return Promise.resolve();
            }).catch(function (error) {
                console.warn("Audio problem:", error);
            })
        }

        // Mettre à jour l'état du bouton à bascule
        setIsPlaying(!isPlaying);
    }

    // Handler for tempo change
    const handleTempoChange = (event: Event, newValue: number | number[]) => {
        if (Array.isArray(newValue)) return;
        setTempo(newValue);
        /*
        if (visualObj) {
            visualObj[0].setBpm(newValue);
        }
        */
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
                        <Typography id="tempo-slider" gutterBottom>
                            Tempo: {tempo} BPM
                        </Typography>
                        <Slider
                            value={tempo}
                            onChange={handleTempoChange}
                            aria-labelledby="tempo-slider"
                            min={30}
                            max={240}
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
