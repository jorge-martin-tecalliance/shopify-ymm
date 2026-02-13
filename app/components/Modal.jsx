import "../styles/modal.css";

export default function Modal({ 
    isOpen, 
    onClose, 
    title, 
    errorMessage,
    fieldLabel,
    fieldValue,
    onFieldChange,
    fieldPlaceholder,
    children,
    onSubmit,
    submitLabel
}) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                <h2>{title}</h2>
                
                {errorMessage && (
                    <div className="error-message">
                        {errorMessage}
                    </div>
                )}
                
                {children ? (
                    children
                ) : (
                    <div className="form-group">
                        <label>{fieldLabel}</label>
                        <input className="form-group-input"
                            type="text"
                            value={fieldValue}
                            onChange={onFieldChange}
                            placeholder={fieldPlaceholder}
                        />
                    </div>
                )}
                
                <div className="form-actions">
                    <button className="btn btn-primary" onClick={onSubmit}>
                        {submitLabel}
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}