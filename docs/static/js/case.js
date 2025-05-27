$(document).ready(function() {
    let currentIndex = 0; 
    let currentCategory = 'operation'; 
    let data = []; 
    let allData = {}; 


    const categories = ['operation', 'logic', 'cipher', 'puzzle', 'counterfactual', 'multiq', 'multir', 'multirq']; 


    loadAllTableData(categories).then(() => {
        loadTableData(currentCategory); 
    });

    $('.tabs ul li').on('click', function() {
        $('.tabs ul li').removeClass('is-active');
        $(this).addClass('is-active');
        const target = $(this).data('target');
        currentCategory = target;
        loadTableData(currentCategory); 
    });

    console.log(currentCategory);


    function loadAllTableData(categories) {
        const promises = categories.map(category => {
            return $.getJSON(`./static/data/case_${category}.json`)
                .done(function(response) {
                    allData[category] = response; 
                })
                .fail(function(jqxhr, textStatus, error) {
                    let err = textStatus + ", " + error;
                    $('#content-area').html(`Error loading data for category ${category}. ${err}`);
                });
        });
        return Promise.all(promises);
    }


    function loadTableData(category) {
        data = allData[category]; 
        if (data && data.length > 0) {
            currentIndex = 0; 
            showItem(currentIndex); 
            setColorScheme(category);
        } else {
            $('#content-area').html('<p>There are no available data for this category.</p>');
        }
    }

    function escapeHtml(html) {
        return html
            .replace(/&/g, '&amp;')  
            .replace(/</g, '&lt;')   
            .replace(/>/g, '&gt;')   
            .replace(/"/g, '&quot;') 
            .replace(/'/g, '&#39;'); 
    }
    
    function showItem(index) {
        const entry = data[index];
        if (entry) {
            if (currentCategory !== 'multiq' && currentCategory !== 'multir' && currentCategory !== 'multirq') {
                $('#rule-content').html(escapeHtml(entry.rule_content).replace(/\n/g, '<br>'));
                $('#question-content').html(escapeHtml(entry.question).replace(/\n/g, '<br>'));
                $('#answer-content').html(escapeHtml(entry.answer).replace(/\n/g, '<br>'));
                $('#model-response').html(escapeHtml(entry.response).replace(/\n/g, '<br>'));
                let correctnessIcon = entry.is_correct 
                ? '<span style="color: #28a745; font-size: 1.2em; position: absolute; right: 30px;">&#10003;</span>' 
                : '<span style="color: #dc3545; font-size: 1.2em; position: absolute; right: 30px;">&#10007;</span>'; 
            

            $('#response-title').html('<div style="position: relative;">Response ' + correctnessIcon + '</div>');
            
            } 
            else {
                let ruleContent = '';
                if (Array.isArray(entry.rule_content_list)) {
                    entry.rule_content_list.forEach((content, index) => {
                        ruleContent += `<h5>Rule ${index + 1}:</h5>`;
                        ruleContent += escapeHtml(content).replace(/\n/g, '<br>') + '<br><br>';
                    });
                }
                $('#rule-content').html(ruleContent);
            
                let questionContent = '';
                if (Array.isArray(entry.question_content_list)) {
                    entry.question_content_list.forEach((question, index) => {
                        questionContent += `<h5>Question ${index + 1}:</h5>`;
                        questionContent += escapeHtml(question).replace(/\n/g, '<br>') + '<br><br>';
                    });
                }
                $('#question-content').html(questionContent);
            
                let answerContent = '';
                if (Array.isArray(entry.answer_content_list)) {
                    entry.answer_content_list.forEach((answer, index) => {
                        answerContent += `<h5>Answer ${index + 1}:</h5>`; 
                        answerContent += escapeHtml(answer).replace(/\n/g, '<br>') + '<br><br>';
                    });
                }
                $('#answer-content').html(answerContent);
                $('#model-response').html(escapeHtml(entry.response).replace(/\n/g, '<br>'));

                let correctnessIcon = entry.is_correct 
                ? '<span style="color: #28a745; font-size: 1.2em; position: absolute; right: 30px;">&#10003;</span>'  
                : '<span style="color: #dc3545; font-size: 1.2em; position: absolute; right: 30px;">&#10007;</span>'; 
            

            $('#response-title').html('<div style="position: relative;">Response ' + correctnessIcon + '</div>');
            }
            
        }
    }
    

    $('.prev').on('click', function() {
        if (data.length > 0) {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : data.length - 1; 
            showItem(currentIndex);
        }
    });

    $('.next').on('click', function() {
        if (data.length > 0) {
            currentIndex = (currentIndex < data.length - 1) ? currentIndex + 1 : 0; 
            showItem(currentIndex);
        }
    });

    function setColorScheme(category) {
        let borderColor, scrollbarColor, scrollbarThumbColor;
        scrollbarColor = '#ffffff'; 

        switch (category) {
            case 'operation':
                borderColor = 'rgba(135, 206, 250, 0.5)';
                scrollbarThumbColor = 'rgba(135, 206, 250, 0.5)'; 
                break;
            case 'logic':
                borderColor = 'rgba(100, 0, 200, 0.15)'; 
                scrollbarThumbColor = 'rgba(100, 0, 200, 0.15)'; 
                break;
            case 'cipher':
                borderColor = 'rgba(255, 140, 0, 0.3)'; 
                scrollbarThumbColor = 'rgba(255, 140, 0, 0.3)'; 
                break;
            case 'puzzle':
                borderColor = 'rgba(255, 0, 0, 0.2)'; 
                scrollbarThumbColor = 'rgba(255, 0, 0, 0.2)'; 
                break;
            case 'counterfactual':
                borderColor = 'rgba(0, 200, 0, 0.2)'; 
                scrollbarThumbColor = 'rgba(0, 200, 0, 0.2)'; 
                break;
            case 'multiq':
            case 'multir':
            case 'multirq':
                borderColor = 'rgba(32, 178, 170, 0.2)'; 
                scrollbarThumbColor = 'rgba(32, 178, 170, 0.2)'; 
                break;
        }
    

        $('.scroll-box').css({
            'border': `3px solid ${borderColor}`, 
            'box-shadow': `0 4px 8px rgba(0, 0, 0, 0.2)` 
        });
    

        document.documentElement.style.setProperty('--scrollbar-color', scrollbarColor);
        document.documentElement.style.setProperty('--scrollbar-thumb-color', scrollbarThumbColor);
    }
    
    
});
