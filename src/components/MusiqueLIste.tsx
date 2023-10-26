import Stack from "@mui/material/Stack"
import { FunctionComponent, } from "react"
import {store} from "../service/store.service"
import { Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const MusiqueListe: FunctionComponent = () => {
    const musics = Object.entries(store.getTable("music")) // Liste des musiques

    const data = () => {
        return musics.map((row) => {
            return {
                id: row[0],
                name: row[1].name,
                dance: row[1].danceId?store.getCell("dance", row[1].danceId.toString(), "name"):""
            }
        })
    }

    return (
        <Stack>
            <h1>Musiques</h1>
            <DataGrid
                rows={data()}
                columns={[
                    { field: 'name', headerName: 'Noms', flex: 1 },
                    { field: 'dance', headerName: 'Danses', flex: 1 },
                ]}
            />

        </Stack>
    )
}

export default MusiqueListe