import { FunctionComponent, useState } from 'react'
import { store } from "../service/store.service"
import { Stack, TextField, Button, ButtonGroup } from '@mui/material'
import { createQueries, ResultCell } from "tinybase"
import { useNavigate } from "react-router-dom";

const SearchPage: FunctionComponent = () => {
  const navigateTo = useNavigate()
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

  const handleMusic = (slug: string) => {
    navigateTo(`/music/${slug}`);
  }

  return (
    <Stack>
      <TextField
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value.toLocaleLowerCase())}
        placeholder="Musique ..."
        label="Musique"
        inputProps={{ style: { fontSize: "2rem" } }}
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
            sx={{
              height: "4rem",
              fontSize: 20,
            }}
            onClick={() => handleMusic(result.id)}
          >
            {result.name}
          </Button>
        ))}
      </ButtonGroup>
    </Stack>
  );
};

export default SearchPage;