import { FunctionComponent } from "react"
import { store } from "../service/store.service"
import Stack from "@mui/material/Stack"
import { Button, ButtonGroup} from "@mui/material"
import { useNavigate } from "react-router-dom"


const DanseListe: FunctionComponent = () => {
    const dances = Object.entries(store.getTable("dance")) // Liste des dances

    /**
     Générer la liste des danses, triée par id
     *
     * @return {Array} 
     */
    const dancedata = () => {
        return dances.map((row) => {
            return {
                id: row[0],
                name: row[1].name,
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
        console.log(slug)
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
                        >{row.name}</Button>
                    ))}
                </ButtonGroup>
            </Stack>


        </Stack>
    )

}

export default DanseListe
