import Stack from "@mui/material/Stack"
import { FunctionComponent, useEffect, useState, } from "react"
import { store } from "../service/store.service"
import { Box, Typography } from "@mui/material";
import { createQueries, ResultCell,Cell } from "tinybase";


export interface MusiqueListeProps {
    slug: string
}

const MusiqueListe: FunctionComponent<MusiqueListeProps> = (props: MusiqueListeProps) => {
    const queries = createQueries(store)
    const [musics, setMusics] = useState<{ id: string, name: ResultCell }[]>([])

    useEffect(() => {
        queries.setQueryDefinition(
            "music4dance", // Nom de la query
            "music", // Nom de la table
            ({ select, where }) => {
                select("name")
                where("danceId", props.slug)
            }
        )

        setMusics(
            Object.entries(queries.getResultTable('music4dance')).map((row) => {
                return {
                    id: row[0],
                    name: row[1].name,
                }
            })
        )
    }, [])

    return (
        <Stack>
            {musics.map((row) => {
                return (
                    <Box key={row.id}>
                        <Typography>
                            {row.name}
                        </Typography>

                    </Box>
                )
            })}

        </Stack>
    )
}

export default MusiqueListe