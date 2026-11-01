import { useParams } from "react-router-dom";
import { store } from "../service/store.service"
import jsonNotations from "../data/notations.json";
import MusicPlayer from "../components/MusicPlayer";

const Music = () => {
    const { slug } = useParams();
    const data = store.getRow('music', slug || '')
    const notations = jsonNotations["abcFiles"][data.notation as keyof typeof jsonNotations["abcFiles"]] as string;

    return (
        <MusicPlayer
            title={String(data.name)}
            copyrightNotice={data.rights == 1 ? `© ${data.authors}` : undefined}
            youtubeId={data.youtube ? String(data.youtube) : undefined}
            notations={notations}
        />
    )
}

export default Music
