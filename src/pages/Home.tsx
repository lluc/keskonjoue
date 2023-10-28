import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { FunctionComponent } from "react"
import DanseListe from "../components/DanseListe"

const Home:FunctionComponent = () => {
    return (
        <Stack>
            <Typography
                variant="body1"
                fontSize={'1.2rem'}
                textAlign={'center'}
                fontStyle={'italic'}
            >Une application pour choisir les morceaux de musique qui vont être joués.
            </Typography>
            <DanseListe />
        </Stack>
    )

}

export default Home