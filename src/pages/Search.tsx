import { FunctionComponent, useState } from 'react'
import { store } from "../service/store.service"
import { Stack, TextField, Button, ButtonGroup } from '@mui/material'
import { createQueries, ResultCell } from "tinybase"

const SearchPage: FunctionComponent = () => {
  const queries = createQueries(store)
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<{
    id: string,
    name: ResultCell
  }[]>([])

  const handleSearch = () => {
    queries.setQueryDefinition(
        "music4dance", // Nom de la query
        "music", // Nom de la table
        ({ select }) => {
            select('name')
        }
    )

    setResults(
        Object.entries(queries.getResultTable('music4dance')).map((row) => {
          if (row[1].name.toString().toLocaleLowerCase().includes(searchTerm)) {
            return {
                id: row[0],
                name: row[1].name,
            }
          }
          return {
            id: "",
            name: "",
          }
        })
    )    

  };

  return (
    <Stack>
        <TextField
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Musique ..."
                label="Musique"
                variant="outlined" 
            />
        <Button onClick={handleSearch} variant="contained">
            Rechercher
        </Button>
        <ButtonGroup
          orientation="vertical"
          variant="outlined"
        >
          {results.map((result) => (
            result.id !== "" &&
            <Button
              key={result.id}
              onClick={() => {
                store.setCell("music", result.id, "name", result.name)
                window.location.href = `/music/${result.id}`
              }}
            >
              {result.name}
            </Button>
          ))}
        </ButtonGroup>
    </Stack>
  );
};

export default SearchPage;