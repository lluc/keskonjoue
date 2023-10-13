import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { FunctionComponent } from "react"


const Home:FunctionComponent = () => {
    return (
        <Stack>
            <Typography
                variant="body1"
                fontSize={'1.2rem'}
                textAlign={'center'}
                my={'20px'}
            >Une application pour choisir les morceaux de musique qui vont être joués.
            </Typography>
        </Stack>
    )

}

export default Home