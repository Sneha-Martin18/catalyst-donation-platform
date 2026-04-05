import { useNavigate } from "react-router-dom";
import "./BackButton.css";

const BackButton = ({ text = "Back" }) => {
    const navigate = useNavigate();

    return (
        <button className="back-button" onClick={() => navigate(-1)}>
            <span className="back-icon">←</span>
            {text}
        </button>
    );
};

export default BackButton;
