import { useParams } from "react-router-dom";
import { store } from "../service/store.service"
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import ABCJS from 'abcjs'
import { useEffect, useState } from "react";
import jsonNotations from "../data/notations.json";
import Youtube from 'react-youtube';


const Music = () => {
    const { slug } = useParams();
    const data = store.getRow('music', slug || '')
    // Ajouter un nouvel état pour le bouton à bascule
    const [isPlaying, setIsPlaying] = useState(false);
    const notations = jsonNotations["abcFiles"][data.notation as keyof typeof jsonNotations["abcFiles"]] as string;
    const midiBuffer = new ABCJS.synth.CreateSynth();

    useEffect(() => {
        if (notations === undefined) {
            return
        }

        const visualObj = ABCJS.renderAbc("paper", notations, {
            responsive: "resize",
            scrollHorizontal: true,
            
                            
        }
        );

        midiBuffer.init({
            audioContext: new AudioContext(),
            visualObj: visualObj[0],
            //sequence: [],
            millisecondsPerMeasure: 1000,
            // debugCallback: function(message) { console.log(message) },
            options: {
                // soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/" ,
                // sequenceCallback: function(noteMapTracks, callbackContext) { return noteMapTracks; },
                // callbackContext: this,
                // onEnded: function(callbackContext),
                // pan: [ -0.5, 0.5 ]
            }
        })
    }, [])

    const togglePlayMusic = () => {
        if (isPlaying) {
            midiBuffer.stop();
        } else {
            midiBuffer.prime().then(function (response) {
                midiBuffer.start();
            }).catch(function (error) {
                console.warn("Audio problem:", error);
            });
        }

        // Mettre à jour l'état du bouton à bascule
        setIsPlaying(!isPlaying);
    }

    return (
        <Stack spacing={2}>
            <Typography variant="h3">
                {data.name}
            </Typography>
            {notations &&
                <Stack>
                    <Box>
                        <Button variant="contained" onClick={togglePlayMusic}>
                            {isPlaying ? 'Arrêter' : 'Jouer'}
                        </Button>

                    </Box>
                    <Box
                        id="paper"
                        px={2}
                    />
                </Stack>
            }
            {data.youtube &&
                <Stack spacing={2}>
                    <Divider />
                    <Typography variant="h5">
                        Vidéo
                    </Typography>
                    <Youtube videoId={data.youtube.valueOf() as string} opts={{ width: '400', height: '300' }} />
                </Stack>
            }
        </Stack>
    )
}

export default Music
