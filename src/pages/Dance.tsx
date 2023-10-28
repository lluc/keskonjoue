import { useParams } from "react-router-dom"
import { store } from "../service/store.service"
import { Divider, Stack, Typography } from "@mui/material";
import MusiqueListe, { MusiqueListeProps } from "../components/MusiqueListe";



const Dance = () => {
    const { slug } = useParams();
    const danse: MusiqueListeProps = {
        slug: slug || ""
    }

    return (
        <Stack spacing={2}>
            <Typography variant="h4">
                {slug ? store.getCell("dance", slug, "name") : ""}
            </Typography>
            <Divider />
            <MusiqueListe {...danse}/>
            


        </Stack>
    )
}

export default Dance
