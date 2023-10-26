import { FunctionComponent } from "react"
import { store, indexes } from "../service/store.service"
import Stack from "@mui/material/Stack"
import { Card, CardHeader, Typography } from "@mui/material"


const DanseListe: FunctionComponent = () => {
    const dances = Object.entries(store.getTable("dance")) // Liste des dances

    return (
        <Stack>
            <h1>Danses</h1>
            <Stack 
                spacing={2}
                pt={2}
                sx={{
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#101010' : 'grey.100'),
                }}
            >
                {indexes.getSliceIds("danceAsc").map((id) => (
                    <Card key={id}>
                        <CardHeader
                            title={id}
                        />
                    </Card>
                ))}
            </Stack>


        </Stack>
    )

}

export default DanseListe
