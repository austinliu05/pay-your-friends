import { Alert } from "react-bootstrap";
import styles from "../styles/Login.module.scss"

interface ErrorMessageProps {
    error: string | null; 
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
    return (
        <div className={`${styles.errorContainer} ${error ? styles.visible : styles.hidden}`}>
            <Alert variant="danger">
                {error || "Placeholder text"}
            </Alert>
        </div>
    );
};

export default ErrorMessage;
