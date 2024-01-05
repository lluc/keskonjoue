import os
import re
import json


def extract_mlk_parts_and_melody(abc_content):
    m_match = re.search(r"^M:\s*([^\n]*)$", abc_content, re.MULTILINE)
    l_match = re.search(r"^L:\s*([^\n]*)$", abc_content, re.MULTILINE)
    k_match = re.search(r"^K:\s*([^\n]*)$", abc_content, re.MULTILINE)
    q_match = re.search(r"^Q:\s*([^\n]*)$", abc_content, re.MULTILINE)
    w_match = re.search(r"^w:\s*([^\n]*)$", abc_content, re.MULTILINE)

    m = m_match.group(1).strip() if m_match else None
    l = l_match.group(1).strip() if l_match else None
    k = k_match.group(1).strip() if k_match else None
    q = q_match.group(1).strip() if q_match else None
    w = w_match.group(1).strip() if w_match else None

    melody_match = re.search(r"K:[^\n]*\n((?:.*\n)+)", abc_content, re.DOTALL)

    if melody_match:
        melody = melody_match.group(1).strip()
    else:
        melody = None

    return f"M: {m}\nL: {l}\nQ: {q}\nK: {k}\n{melody}\nw: {w}"


def abc_to_json(abc_content):
    # Échapper les caractères spéciaux JavaScript
    js_escaped_content = abc_content.replace("\n", "\\n").replace('"', '\\"')

    return js_escaped_content
    mlk_parts = re.findall(r"^(M|L|K):.*$", abc_content, re.MULTILINE)
    return " ".join(mlk_parts)


def convert_abc_files_to_json(files):
    json_data = {"abcFiles": {}}

    for file_path in files:
        with open(file_path, "r") as abc_file:
            abc_content = abc_file.read()

        file_name = os.path.basename(file_path)
        json_data["abcFiles"][file_name] = extract_mlk_parts_and_melody(abc_content)
        print(file_name)

    return json_data


def save_json_resource(json_data, output_file_path):
    with open(output_file_path, "w") as json_file:
        json.dump(json_data, json_file, indent=2)


# Exemple d'utilisation
abc_files_folder = "./notations"
output_json_file = "../src/data/notations.json"

abc_files = [
    os.path.join(abc_files_folder, f)
    for f in os.listdir(abc_files_folder)
    if f.endswith(".abc")
]

json_data = convert_abc_files_to_json(abc_files)
save_json_resource(json_data, output_json_file)
