// 添加调试信息
console.log('pdf.js loaded');

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('PDF viewer initialization started');
    
    const pdfFiles = [
        './static/images/further_analysis/focus_results/logic_246.pdf',
        './static/images/further_analysis/focus_results/cipher_28.pdf',
        './static/images/further_analysis/focus_results/puzzle_58.pdf',
        './static/images/further_analysis/focus_results/counterfactual_32.pdf'
    ];

    let currentPdfIndex = 0; 

    function updatePdfDisplay() {
        console.log('Updating PDF display');
        const pdfContainer = document.getElementById('pdf-viewer');
        if (!pdfContainer) {
            console.error('PDF container not found');
            return;
        }
        
        try {
            pdfContainer.innerHTML = `<iframe src="${pdfFiles[currentPdfIndex]}" width="100%" height="500px" style="border: none;" allowfullscreen></iframe>`;
            console.log('PDF display updated successfully');
        } catch (error) {
            console.error('Error updating PDF display:', error);
        }
    }

    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    console.log('Prev button:', prevButton);
    console.log('Next button:', nextButton);

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            console.log('Previous button clicked');
            if (currentPdfIndex > 0) {
                currentPdfIndex--;
                updatePdfDisplay();
            }
        });
    } else {
        console.warn('Previous button not found');
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            console.log('Next button clicked');
            if (currentPdfIndex < pdfFiles.length - 1) {
                currentPdfIndex++;
                updatePdfDisplay();
            }
        });
    } else {
        console.warn('Next button not found');
    }

    updatePdfDisplay();
});
