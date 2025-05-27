document.addEventListener('DOMContentLoaded', (event) => {
    const pdfFiles = [
        './static/images/further_analysis/focus_results/logic_246.pdf',
        './static/images/further_analysis/focus_results/cipher_28.pdf',
        './static/images/further_analysis/focus_results/puzzle_58.pdf',
        './static/images/further_analysis/focus_results/counterfactual_32.pdf'
    ];

    let currentPdfIndex = 0; 

    function updatePdfDisplay() {
        const pdfContainer = document.getElementById('pdf-viewer');
        pdfContainer.innerHTML = `<iframe src="${pdfFiles[currentPdfIndex]}" width="100%" height="500px" style="border: none;" allowfullscreen></iframe>`;
    }

    document.getElementById('prevButton').addEventListener('click', () => {
        if (currentPdfIndex > 0) {
            currentPdfIndex--;
            updatePdfDisplay();
        }
    });

    document.getElementById('nextButton').addEventListener('click', () => {
        if (currentPdfIndex < pdfFiles.length - 1) {
            currentPdfIndex++;
            updatePdfDisplay();
        }
    });

    updatePdfDisplay();
});
