export interface ChangelogEntry {
    version: string;
    items: string[];
}

// Les entrées les plus récentes en premier. On n'en affiche que quelques-unes
// dans "À propos" (cf. AboutDialog) : pas la peine de remonter tout l'historique.
export const CHANGELOG: ChangelogEntry[] = [
    {
        version: '1.8.0',
        items: [
            "Doigtés flûte à bec (soprano et alto, systèmes baroque et allemand) dans la tablature",
            "Le surlignage de la note jouée et le bouton Jouer/Pause restent visibles pendant le défilement",
        ],
    },
    {
        version: '1.7.0',
        items: [
            "Import d'un fichier ABC ou MIDI externe, sans l'ajouter au catalogue",
        ],
    },
    {
        version: '1.6.0',
        items: [
            "Tablature flûte irlandaise avec notation solfège (do, ré, mi...)",
            "Module d'apprentissage : boucle de lecture sur une plage de mesures",
        ],
    },
];
