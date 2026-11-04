import type { HoleState, WindInstrument } from "./FluteTablature";

export type RecorderSystem = "baroque" | "german";
export type RecorderSize = "soprano" | "alto";

// Doigtés relatifs à la tonique (système baroque/anglais), vérifiés contre
// https://www.dolmetsch.com/textfingeringchart.htm ("Recorders in C" / "Recorders in F").
// Les deux tables ("in C" et "in F") y sont rigoureusement identiques une fois réindexées
// par demi-ton depuis la tonique - une seule table relative suffit donc pour toutes les
// tailles de flûte à bec (vérifié note à note lors de la transcription).
//
// Numérotation des trous (de haut en bas) : 0=pouce, 1,2,3,4,5=trous simples,
// 6=trou double (6a+6b), 7=trou double (7a+7b). "x" = pouce entrouvert ("pincé").
function fromPositions(list: string[]): HoleState[] {
    const has = (p: string) => list.includes(p);
    const hole = (n: number): HoleState => (has(String(n)) ? "closed" : "open");
    const split = (a: string, b: string): HoleState => {
        const ca = has(a);
        const cb = has(b);
        if (ca && cb) return "closed";
        if (ca || cb) return "half";
        return "open";
    };
    const thumb: HoleState = has("0") ? "closed" : has("x") ? "half" : "open";
    return [thumb, hole(1), hole(2), hole(3), hole(4), hole(5), split("6a", "6b"), split("7a", "7b")];
}

// Registre 1 (octave de base), demi-ton 0 (tonique) à 11, doigté baroque.
const REGISTER_1_BAROQUE: HoleState[][] = [
    fromPositions(["0", "1", "2", "3", "4", "5", "6a", "6b", "7a", "7b"]), // 0  tonique
    fromPositions(["0", "1", "2", "3", "4", "5", "6a", "6b", "7a"]),       // 1
    fromPositions(["0", "1", "2", "3", "4", "5", "6a", "6b"]),             // 2
    fromPositions(["0", "1", "2", "3", "4", "5", "6a"]),                  // 3
    fromPositions(["0", "1", "2", "3", "4", "5"]),                        // 4
    fromPositions(["0", "1", "2", "3", "4", "6a", "6b", "7a", "7b"]),      // 5  fa (fourchu)
    fromPositions(["0", "1", "2", "3", "5", "6a", "6b"]),                 // 6
    fromPositions(["0", "1", "2", "3"]),                                  // 7
    fromPositions(["0", "1", "2", "4", "5", "6a"]),                       // 8
    fromPositions(["0", "1", "2"]),                                       // 9
    fromPositions(["0", "1", "3", "4"]),                                  // 10
    fromPositions(["0", "1"]),                                            // 11
];

// Registre 2 (pouce pincé), demi-ton 0 à 11.
const REGISTER_2_BAROQUE: HoleState[][] = [
    fromPositions(["0", "2"]),
    fromPositions(["1", "2"]),
    fromPositions(["2"]),
    fromPositions(["2", "3", "4", "5", "6a", "6b"]),
    fromPositions(["x", "1", "2", "3", "4", "5"]),
    fromPositions(["x", "1", "2", "3", "4", "6a", "6b"]), // fa (fourchu)
    fromPositions(["x", "1", "2", "3", "5"]),
    fromPositions(["x", "1", "2", "3"]),
    fromPositions(["x", "1", "2", "4"]),
    fromPositions(["x", "1", "2"]),
    fromPositions(["x", "1", "2", "5", "6a", "6b"]),
    fromPositions(["x", "1", "2", "4", "5"]),
];

// Registre 3 (aigu), demi-ton 0 à 7 seulement - au-delà, rare et non documenté par la
// source : on retombe alors sur le doigté du registre 2 (approximation signalée).
const REGISTER_3_BAROQUE: HoleState[][] = [
    fromPositions(["x", "1", "4", "5"]),
    fromPositions(["x", "1", "3", "4", "6a", "6b"]), // + bas du corps bouché ("close"), non représenté ici
    fromPositions(["x", "1", "3", "4", "6a", "6b"]),
    fromPositions(["x", "2", "3", "5", "6a", "6b"]),
    fromPositions(["x", "2", "3", "5", "6a", "6b"]),
    fromPositions(["x", "1", "2", "4", "5"]),
    fromPositions(["x", "1", "2", "4", "5"]),
    fromPositions(["x", "1", "4"]),
];

// Système allemand : seul le fa (demi-ton 5, dans les deux premiers registres) change -
// doigté "direct" au lieu du doigté fourchu. Le fa# reste une note à demi-trou dans les
// deux systèmes (pas de doigté allemand distinct documenté). Registre 3 non documenté
// séparément pour l'allemand -> on y réutilise le doigté baroque.
const REGISTER_1_GERMAN = REGISTER_1_BAROQUE.map((pattern, i) =>
    i === 5 ? fromPositions(["0", "1", "2", "3", "4"]) : pattern
);
const REGISTER_2_GERMAN = REGISTER_2_BAROQUE.map((pattern, i) =>
    i === 5 ? fromPositions(["x", "1", "2", "3", "4"]) : pattern // registre 2 du fa allemand : non sourcé, déduit par analogie
);

function registerTableFor(system: RecorderSystem, register: number): HoleState[][] {
    if (register <= 0) return system === "german" ? REGISTER_1_GERMAN : REGISTER_1_BAROQUE;
    if (register === 1) return system === "german" ? REGISTER_2_GERMAN : REGISTER_2_BAROQUE;
    return REGISTER_3_BAROQUE; // registre 3 : identique dans les deux systèmes (non documenté pour l'allemand)
}

export function recorderFingeringFor(system: RecorderSystem, semitoneFromTonic: number, octave: number): HoleState[] {
    const s = ((semitoneFromTonic % 12) + 12) % 12;
    const register = Math.max(0, Math.min(2, octave));
    const table = registerTableFor(system, register);
    return table[s] ?? table[s % table.length];
}

// Fondamentale (note la plus grave) de chaque taille, en numéro MIDI :
// soprano = Do5 (72), alto = Fa4 (65) - correspond à la tessiture réelle de l'instrument,
// contrairement au tin whistle où la tonique peut être n'importe laquelle des 5 tonalités.
const RECORDER_SIZES: Record<RecorderSize, { label: string; tonicPitchClass: number; fundamentalMidi: number }> = {
    soprano: { label: "soprano", tonicPitchClass: 0, fundamentalMidi: 72 },
    alto: { label: "alto", tonicPitchClass: 5, fundamentalMidi: 65 },
};

const SYSTEM_LABEL: Record<RecorderSystem, string> = {
    baroque: "doigté baroque",
    german: "doigté allemand",
};

export const RECORDER_INSTRUMENTS: WindInstrument[] = (["soprano", "alto"] as RecorderSize[]).flatMap((size) =>
    (["baroque", "german"] as RecorderSystem[]).map((system) => {
        const { label, tonicPitchClass, fundamentalMidi } = RECORDER_SIZES[size];
        return {
            id: `recorder-${size}-${system}`,
            label: `Flûte à bec ${label} (${SYSTEM_LABEL[system]})`,
            tonicPitchClass,
            fundamentalMidi,
            fingeringFor: (semitoneFromTonic: number, octave: number) =>
                recorderFingeringFor(system, semitoneFromTonic, octave),
        };
    })
);
