import { FunctionComponent, useEffect } from "react"
import { store } from "../service/store.service"
import Stack from "@mui/material/Stack"
import { Button, ButtonGroup} from "@mui/material"
import { useNavigate } from "react-router-dom"


const DanseListe: FunctionComponent = () => {
    // Prefetch des pages Dance et Music pour une navigation fluide
    useEffect(() => {
        import('../pages/Dance')
        import('../pages/Music')
    }, [])
    const dances = Object.entries(store.getTable("dance")) // Liste des dances

    /**
     Générer la liste des danses, triée par id
     *
     * @return {Array} 
     */
    const dancedata = () => {
        return dances.map((row) => {
            const musicCount = Object.values(store.getTable("music")).filter(
                (musicRow) => musicRow.danceId === row[0]
            ).length;
    
            return {
                id: row[0],
                name: row[1].name,
                musicCount: musicCount,
            }
        })
        .sort((a, b) => a.id.localeCompare(b.id));
    }
    
    const dancesOrdered = dancedata()

    const navigateTo = useNavigate()

    /**
     * Handle click event.
     *
     * @param {string} slug - The slug parameter.
     */
    const handleClick = (slug: string) => {
        navigateTo(`/dance/${slug}`)
    }

    return (
        <Stack>
            <h1>Danses</h1>
            <Stack
                spacing={2}
            >
                <ButtonGroup
                    orientation="vertical"
                    variant="outlined"
                >
                    {dancesOrdered.map((row) => (
                        <Button
                            key={row.id}
                            sx={{
                                height: "4rem",
                                fontSize: 20,
                            }}
                            onClick={() => handleClick(row.id)}
                        >{row.musicCount > 0 ? `${row.name} - (${row.musicCount})` : row.name}</Button>
                    ))}
                </ButtonGroup>
            </Stack>


        </Stack>
    )

}

export default DanseListe
