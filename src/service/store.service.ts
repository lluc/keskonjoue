import { createIndexes, createQueries, createRelationships, createStore } from "tinybase";
import jsonData from "../data.json";

export const store = createStore();
export const relations = createRelationships(store);
export const indexes = createIndexes(store);

// Charge les données depuis le fichier JSON dans Tinybase
store.setJson(JSON.stringify(jsonData));

// Relations
relations.setRelationshipDefinition(
    "musicDance", // Nom de la relation
    "music", // Nom de la table
    "dance", // Nom de la table de la relation
    "danceId", // Nom de la colonne de la table de la relation
    )

// Indexes
indexes.setIndexDefinition(
    "danceAsc", // Nom de l'index
    "dance", // Nom de la table
    "name", // Nom de la colonne pour l'indexation
    "name", // Nom de la colonne de tri
    (id1, id2) => (id1 < id2 ? -1 : 1), // Fonction de tri, ordre alphabétique
)
