import { useParams } from "react-router-dom";

const Music = () => {
    const { slug } = useParams();

    return (
        <div>
            <h1>{slug}</h1>
        </div>
    )
}

export default Music
