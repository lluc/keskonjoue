from music21 import converter, tablature, note

# Remplacez 'path_to_abc_file.abc' par le chemin de votre fichier ABC
abc_file_path = "notations/bourree_dindes.abc"


# Créer liste de notes pour le violon
def notes_tab(lib_note: str, nb_frets: int) -> list:
    n = note.Note(lib_note).pitch.midi
    return [n + i for i in range(0, nb_frets)]


def tablature_violon(fichier_abc: str) -> str:
    # Utiliser le convertisseur pour lire le fichier ABC
    abc_score = converter.parse(fichier_abc)

    # Créer liste de notes pour le violon

    # Cordes du violon
    cordeG = notes_tab("G3", 6)
    cordeD = notes_tab("D4", 6)
    cordeA = notes_tab("A4", 6)
    cordeE = notes_tab("E4", 6)

    strings = ["E", "A", "D", "G"]
    # Initialize the tab lines for each string
    tab_lines = {string: [] for string in strings}

    for partie in abc_score.parts:
        for mesure in partie.getElementsByClass("Measure"):
            for s in strings:
                tab_lines[s].append("|")
            for note in mesure.notes:
                if "Note" in note.classes:
                    midi = note.pitch.midi
                    for s in strings:
                        tab_lines[s].append("-")
                    if midi in cordeA:
                        tab_lines["A"].pop()
                        tab_lines["A"].append(str(cordeA.index(midi)))
                    elif midi in cordeD:
                        tab_lines["D"].pop()
                        tab_lines["D"].append(str(cordeD.index(midi)))
                    elif midi in cordeG:
                        tab_lines["G"].pop()
                        tab_lines["G"].append(str(cordeG.index(midi)))
                    elif midi in cordeE:
                        tab_lines["E"].pop()
                        tab_lines["E"].append(str(cordeE.index(midi)))

    # Convert the tab lines to an ASCII table
    ascii_tab = ""
    for string in strings:  # Start from the G string
        ascii_tab += string + "|-" + "-".join(str(f) for f in tab_lines[string]) + "\n"

    return ascii_tab


tab_violon = tablature_violon(abc_file_path)
print(tab_violon)
