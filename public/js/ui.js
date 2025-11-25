// js/ui.js - Custom modal/message handler to replace alert()
export function showMessage(title, message, isError = false) {
    // 1. Create a modal container if it doesn't exist
    let modal = document.getElementById('custom-message-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'custom-message-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.6); z-index: 9999;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.3s ease;
        `;
        document.body.appendChild(modal);
    }

    // 2. Create the card content
    modal.innerHTML = `
        <div class="card" style="max-width: 400px; width: 90%; padding: 25px; text-align: center; transform: translateY(-20px); transition: transform 0.3s ease;">
            <h3 style="color: ${isError ? 'red' : 'var(--purple)'}; margin-bottom: 10px;">${title}</h3>
            <p style="color: var(--text); margin-bottom: 20px;">${message}</p>
            <button id="modal-close-btn" class="btn" style="background: ${isError ? 'red' : 'var(--orange)'};">Close</button>
        </div>
    `;
    
    // 3. Display the modal
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.card').style.transform = 'translateY(0)';
    }, 10);

    // 4. Close handler
    const closeBtn = document.getElementById('modal-close-btn');
    const closeModal = () => {
        modal.style.opacity = '0';
        modal.querySelector('.card').style.transform = 'translateY(-20px)';
        setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Export a standardized error handler
export function showError(err) {
    const message = err.message || "An unknown error occurred.";
    showMessage("Error", message, true);
}

// Export the success handler
export function showSuccess(message) {
    showMessage("Success", message, false);
}