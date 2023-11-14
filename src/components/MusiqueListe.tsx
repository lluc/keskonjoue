import { FunctionComponent, useEffect, useState, } from "react"
import { store } from "../service/store.service"
import { Button, ButtonGroup } from "@mui/material";
import { createQueries, ResultCell } from "tinybase";
import { useNavigate } from "react-router-dom";


export interface MusiqueListeProps {
    slug: string
}

const MusiqueListe: FunctionComponent<MusiqueListeProps> = (props: MusiqueListeProps) => {
    const queries = createQueries(store)
    const [musics, setMusics] = useState<{ id: string, name: ResultCell }[]>([])

    const navigateTo = useNavigate()

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

    const handleMusic = (slug: string) => {
        navigateTo(`/music/${slug}`);
    }

    return (
        <ButtonGroup
            orientation="vertical"
            variant="outlined"
        >
            {musics.map((row) => {
                return (
                    <Button
                        key={row.id}
                        sx={{
                            height: "4rem",
                            fontSize: 20,
                        }}
                        onClick={() => handleMusic(row.id)}
                    >
                        {row.name}
                    </Button>
                )
            })}

        </ButtonGroup >
    )
}

export default MusiqueListe