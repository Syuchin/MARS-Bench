// 从本地的 JSON 文件中读取数据
fetch('./static/data/statistic.json')
    .then(response => response.json())
    .then(data => {
        // 调用多个函数来处理和显示不同的数据
        displayStatistics(data.statistics);
        // displayRuleDistribution(data.rule_distribution);
        // displayAnswerFormats(data.answer_formats);
        // displayDistribution(data.distribution);
    })
    .catch(error => console.error('Error loading JSON:', error));

// 显示 statistics 表格
function displayStatistics(statistics) {
    const container = document.getElementById('data-container');

    // 创建表格
    const table = document.createElement('table');

    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Category', 'Total Rs', 'Avg R Len', 'Max R Len', 'Total Qs', 'Avg Q Len', 'Ans Fmt'];
    
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 创建表体
    const tbody = document.createElement('tbody');
    
    statistics.forEach(item => {
        const row = document.createElement('tr');
        
        // 为每列添加数据
        row.innerHTML = `
            <td>${item.Category}</td>
            <td>${item['Total Rs']}</td>
            <td>${item['Avg R Len']}</td>
            <td>${item['Max R Len']}</td>
            <td>${item['Total Qs']}</td>
            <td>${item['Avg Q Len']}</td>
            <td>${item['Ans Fmt'].join(', ')}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
}

// 显示 rule_distribution 表格
function displayRuleDistribution(rule_distribution) {
    const container = document.getElementById('data-container');

    // 创建表格
    const table = document.createElement('table');
    const caption = document.createElement('caption');
    caption.innerHTML = `
    <strong>Statistical Overview of Rule Distribution.</strong> This table presents the hierarchical categorization of rules within five task categories, including subcategories and tertiary classifications, along with their corresponding rule counts.`;
    caption.style.captionSide = 'bottom'; 
    table.appendChild(caption);

    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Category', 'Subcategory', 'Description', 'Rule Count', 'Total Rules', 'Total Questions'];
    
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 创建表体
    const tbody = document.createElement('tbody');
    
    rule_distribution.forEach(item => {
        const row = document.createElement('tr');
        
        // 为每列添加数据
        row.innerHTML = `
            <td>${item.Category}</td>
            <td>${item.Subcategory}</td>
            <td>${item.Description}</td>
            <td>${item['Rule Count']}</td>
            <td>${item['Total Rules']}</td>
            <td>${item['Total Questions']}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
}

// 显示 answer_formats 表格
function displayAnswerFormats(answer_formats) {
    const container = document.getElementById('data-container');

    // 创建表格
    const table = document.createElement('table');
    const caption = document.createElement('caption');
    caption.innerHTML = `
    <strong>Explanation and Examples of Answer Formats.</strong> This table provides explanations and examples for the five answer formats.`;
    caption.style.captionSide = 'bottom'; 
    table.appendChild(caption);

    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Category', 'Explanation', 'Cases'];
    
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 创建表体
    const tbody = document.createElement('tbody');
    
    answer_formats.forEach(item => {
        const row = document.createElement('tr');
        
        // 为每列添加数据
        row.innerHTML = `
            <td>${item.Category}</td>
            <td>${item.Explanation}</td>
            <td>${item.Cases.join(', ')}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
}

// 显示 distribution 表格
function displayDistribution(distribution) {
    const container = document.getElementById('data-container');

    // 创建表格
    const table = document.createElement('table');
    const caption = document.createElement('caption');
    caption.innerHTML = `
    <strong>Statistical Overview of Answer Format Distribution.</strong> This table shows several answer formats and their numbers and percentages for the five types of tasks.`;
    caption.style.captionSide = 'bottom'; 
    table.appendChild(caption);

    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Category', 'NR', 'ME', 'TR', 'MC', 'SD'];
    
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 创建表体
    const tbody = document.createElement('tbody');
    
    distribution.forEach(item => {
        const row = document.createElement('tr');
        
        // 为每列添加数据
        row.innerHTML = `
            <td>${item.Category}</td>
            <td>${item.NR}</td>
            <td>${item.ME}</td>
            <td>${item.TR}</td>
            <td>${item.MC}</td>
            <td>${item.SD}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
}


