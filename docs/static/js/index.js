// static/js/index.js

// 初始化 Bulma Carousel（如果项目中使用到了轮播）
$(document).ready(function() {
  bulmaCarousel.attach('.carousel', {
    slidesToScroll: 1,
    slidesToShow: 1,
    loop: true,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 3000,
  });
});

document.addEventListener('DOMContentLoaded', function() {
  // MARS-Bench 任务类型循环切换
  const segments = ['overall','instruction-following','context-retrieval','information-reasoning','task-switching'];
  let current = 0;

  // 存储从后端获取的原始 leaderboard 数据及预计算的排名
  let rawData = [], scores = {};

  // DOM 元素引用
  const toggleEl      = document.getElementById('toggle-model-type');
  const table         = document.getElementById('mars-bench-table');

  // 2. 加载 leaderboard 数据
  fetch('./static/data/mars_leaderboard_data.json')
    .then(resp => {
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    })
    .then(json => {
      rawData = json.map((r, i) => ({ ...r, __idx: i }));
      scores = computeScores(rawData);
      renderTable();
    })
    .catch(err => {
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = `<tr><td colspan="100%">Error loading data: ${err.message}</td></tr>`;
    });

  // 切换板块
  toggleEl.addEventListener('click', () => {
    current = (current + 1) % segments.length;
    const next = segments[(current + 1) % segments.length];
    toggleEl.textContent = `Segment: ${segments[current]} (Tap to switch to ${next})`;
    renderTable();
  });

  // 预计算排名
  function computeScores(arr) {
    const out = {};
    for (const seg of segments) {
      const rows = arr.filter(r => r.type === seg);
      if (!rows.length) continue;
      const keys = Object.keys(rows[0]).filter(k =>
        !['model','type','thinking','__idx'].includes(k)
      );
      for (const k of keys) {
        const vals   = rows.map(r => parseFloat(r[k])).filter(v => !isNaN(v));
        const sorted = [...new Set(vals)].sort((a, b) => b - a);
        out[k] = arr.map(r => {
          if (r.type !== seg) return -1;
          const v = parseFloat(r[k]);
          return isNaN(v) ? -1 : sorted.indexOf(v);
        });
      }
    }
    return out;
  }

  // 渲染表格
  function renderTable() {
    const seg    = segments[current];
    const rows   = rawData.filter(r => r.type === seg);
    const tbody  = table.querySelector('tbody');
    const theadR = table.querySelector('thead tr');

    tbody.innerHTML  = '';
    theadR.innerHTML = '';

    if (!rows.length) {
      theadR.innerHTML = '<th class="has-text-centered">Model</th><th class="has-text-centered">No data</th>';
      tbody.innerHTML  = `<tr><td colspan="2" class="has-text-centered">No entries for "${seg}"</td></tr>`;
      return;
    }

    // 动态生成表头
    const fields = [
      'model',
      ...Object.keys(rows[0]).filter(k => !['model','type','thinking','__idx'].includes(k))
    ];
    fields.forEach(f => {
      const th = document.createElement('th');
      th.textContent = f;
      th.classList.add('sortable','has-text-centered');
      theadR.appendChild(th);
    });

    // 渲染每行
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.classList.add(r.thinking ? 'reasoning-model-row' : 'standard-model-row');
      fields.forEach(f => {
        const td  = document.createElement('td');
        const val = r[f] != null ? r[f] : '-';
        const rank = scores[f]?.[r.__idx] ?? -1;
        
        let displayVal = val;
        if (seg === 'overall' && f === 'Overall') { // Check if current segment is 'overall' and field is 'Overall'
          if (rank === 0) {
            displayVal = `🥇 ${val}`;
          } else if (rank === 1) {
            displayVal = `🥈 ${val}`;
          } else if (rank === 2) {
            displayVal = `🥉 ${val}`;
          }
        } else {
          if (rank === 0) {
            displayVal = `<strong>${val}</strong>`;
          } else if (rank === 1) {
            displayVal = `<u>${val}</u>`;
          }
        }
        td.innerHTML = displayVal;
        td.classList.add('has-text-centered');
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    // 绑定排序
    Array.from(table.querySelectorAll('thead th.sortable')).forEach(th => {
      th.onclick = () => sortTable(th);
    });
  }

  // 列排序
  function sortTable(header) {
    const idx = Array.from(header.parentNode.children).indexOf(header);
    const asc = header.classList.toggle('asc');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    rows.sort((a, b) => {
      const aT = a.children[idx].textContent.trim();
      const bT = b.children[idx].textContent.trim();
      return asc
        ? aT.localeCompare(bT, undefined, { numeric: true })
        : bT.localeCompare(aT, undefined, { numeric: true });
    });
    rows.forEach(r => table.querySelector('tbody').appendChild(r));
  }

  // Modal functionality
  const exampleModal = document.getElementById('exampleModal');
  const exampleModalTitle = document.getElementById('exampleModalTitle');
  const exampleModalQuestion = document.getElementById('exampleModalQuestion');
  const exampleModalAnswer = document.getElementById('exampleModalAnswer');
  const exampleModalChecklist = document.getElementById('exampleModalChecklist');
  const exampleModalClose = document.getElementById('exampleModalClose');
  const modalBackground = exampleModal ? exampleModal.querySelector('.modal-background') : null;

  const viewExampleButtons = document.querySelectorAll('.view-example-button');

  if (viewExampleButtons && exampleModal && exampleModalTitle && exampleModalQuestion && exampleModalAnswer && exampleModalChecklist && exampleModalClose && modalBackground) {
    viewExampleButtons.forEach(button => {
      button.addEventListener('click', () => {
        const exampleKey = button.dataset.exampleKey;
        const exampleData = taskExamples[exampleKey];

        if (exampleData) {
          exampleModalTitle.textContent = exampleData.title || 'Task Example';
          exampleModalQuestion.textContent = exampleData.question || 'No question provided.';
          exampleModalAnswer.textContent = exampleData.answer || 'No answer provided.';
          exampleModalChecklist.textContent = exampleData.checklist || 'No checklist provided.';
          exampleModal.classList.add('is-active');
        } else {
          exampleModalTitle.textContent = 'Error';
          exampleModalQuestion.textContent = `Example data for "${exampleKey}" not found.`;
          exampleModalAnswer.textContent = '';
          exampleModalChecklist.textContent = '';
          console.error(`Example data for "${exampleKey}" not found. Check 'taskExamples' in index.js and 'data-example-key' in HTML.`);
          exampleModal.classList.add('is-active');
        }
      });
    });

    const closeModal = () => {
      exampleModal.classList.remove('is-active');
    };

    exampleModalClose.addEventListener('click', closeModal);
    modalBackground.addEventListener('click', closeModal);
  } else {
    console.error("Modal elements or view example buttons not found. Check HTML structure and IDs.");
  }
});

const taskExamples = {
  "score-tracking": {
    title: "Score Tracking Example",
    question: `GAME INFO
<Time-Play Table>
12:00\tNick Richards vs. Bismack Biyombo (Tyus Jones gains possession)
11:47\tKevin Durant misses 16-foot jumper
11:44\tBismack Biyombo defensive rebound
11:30\tDe'Aaron Fox makes 22-foot three point jumper (Chris Paul assists)
11:08\tTyus Jones misses 22-foot three point jumper
other play-by-play records......
9:32\tRoyce O'Neale defensive rebound
</Time-Play Table>
---
Now, your friend has said:
What is the current score between the two teams? Can you help me analyze it?`,
    answer: `The current score is Phoenix Suns 2 - San Antonio Spurs 8.`,
    checklist: `{
    "Phoenix Suns's score is 2": 0.5,
    "San Antonio Spurs's score is 8": 0.5
}`
  },
  "fixed-format-single-turn-response": {
    title: "Fixed-format Single-Turn Response Example",
    question: `GAME INFO
<Time-Play Table>
3:40\tJulian Champagnie defensive rebound
3:36\tDevin Vassell misses running pullup jump shot
3:33\tDevin Vassell offensive rebound
3:29\tKeldon Johnson makes 23-foot three point jumper (Julian Champagnie assists)
3:14\tGrayson Allen bad pass (Stephon Castle steals)
other play-by-play records......
1:51\tSuns defensive team rebound
</Time-Play Table>
---
Now, your friend has said:
I think Phoenix Suns is awesome, I want to write a sentence as support, can you help me write one? Write a sentence no longer than 20 words. Starting from the fifth word, the first letters of consecutive words must be sequentially composed of "Team name initial" plus "KING", and the order must match each letter, with no interruptions in between. If the team name is "NewYork Yankees", the first letters of consecutive words must be "NYKING".

Two turns after this one, after your normal answer, add a short summary in <Summary></Summary> tags. The summary should cover the match progress so far, be under 50 words, and be placed at the end without affecting the answer's flow or format.`,
    answer: `Open answer, please evaluate according to the checklist.`,
    checklist: `{
    "Adheres to English less than 100 words": 0.1,
    "Adheres to three paragraphs, each ending with the same rhyme sound (excluding tags)": 0.1,
    "Adheres to beginning with correct bracket ([Other Questions])": 0.05,
    "Excludes tags as expected (No tag expected)": 0.25,
    "Generated sentence starts the required letter sequence ('PSKING') from the 5th word": 0.25,
    "Generated sentence uses consecutive words to form the complete required letter sequence ('PSKING')": 0.25
}`
  },
  "turn-conditioned-prompted-formatting": {
    title: "Turn-conditioned Prompted Formatting Example",
    question: `GAME INFO
<Time-Play Table>
12:00\tNick Richards vs. Bismack Biyombo (Tyus Jones gains possession)
11:47\tKevin Durant misses 16-foot jumper
11:44\tBismack Biyombo defensive rebound
11:30\tDe'Aaron Fox makes 22-foot three point jumper (Chris Paul assists)
11:08\tTyus Jones misses 22-foot three point jumper
11:05\tNick Richards offensive rebound
11:01\tRoyce O'Neale misses 24-foot three point jumper
11:01\tNick Richards offensive rebound
11:01\tNick Richards misses dunk
11:01\tDevin Vassell defensive rebound
10:58\tChris Paul makes 15-foot pullup jump shot
10:37\tKevin Durant misses 25-foot three point jumper
10:37\tDe'Aaron Fox defensive rebound
10:24\tHarrison Barnes makes 22-foot three point jumper (Chris Paul assists)
10:08\tDevin Booker misses 13-foot pullup jump shot
10:08\tSuns offensive team rebound
10:05\tKevin Durant makes 14-foot pullup jump shot
9:48\tDe'Aaron Fox misses driving floating jump shot
9:46\tNick Richards defensive rebound
9:41\tDevin Booker misses two point shot
9:39\tChris Paul defensive rebound
9:36\tHarrison Barnes misses 23-foot three point shot
9:32\tRoyce O'Neale defensive rebound
</Time-Play Table>
---
Now, your friend has said:
What is the current score between the two teams? Can you help me analyze it?`,
    answer: `Open answer, please evaluate according to the checklist`,
    checklist: `{
    "Adheres to English less than 100 words": 0.2,
    "Adheres to three paragraphs, each ending with the same rhyme sound (excluding tags)": 0.2,
    "Adheres to beginning with correct bracket ([Other Questions])": 0.1,
    "Includes correct tag ([Tags A] expected)": 0.5
}`
  },
  "turn-conditioned-inferred-formatting": {
    title: "Turn-conditioned Inferred Formatting Example",
    question: `GAME INFO
<Time-Play Table>
End of Quarter / Half-time break
</Time-Play Table>
---
Now, your friend has said:
Wow, the First quarter was really exciting! Both teams performed very well, and the game was very intense. I paid special attention to the top scorer(s) Stephon Castle, De'Aaron Fox, who seemed to have many impressive performances. Do you remember their/his shooting statistics for this quarter?

Please provide the answer in the following format for each top scorer:
[Player Name]:
Attempts: [Total Attempts]
Hits: [Total Hits]
- Two-pointers: [Number]
- Three-pointers: [Number]
- Free throws: [Number]
Total Points: [Total Points]`,
    answer: `Open answer, please evaluate according to the checklist`,
    checklist: `{
    "Adheres to English less than 100 words": 0.1,
    "Adheres to three paragraphs, each ending with the same rhyme sound (excluding tags)": 0.1,
    "Adheres to beginning with correct bracket ([Other Questions])": 0.05,
    "Excludes tags as expected (No tag expected)": 0.25,
    "Includes <Summary> tags (Gate condition)": 0.0,
    "Summary content is less than 50 words": 0.25,
    "Summary content accurately reflects game history up to this point": 0.25
}`
  },
  "anchored-event-retrieval": {
    title: "Anchored Event Retrieval Example",
    question: `GAME INFO
<Time-Play Table>
End of Quarter / Half-time break
</Time-Play Table>
---
Now, your friend has said:
Wow, the Second quarter was really exciting! Both teams performed very well, and the game was very intense. 
I remember LeBron James scored in (quarter2 9:27), and 8.0 minutes and 38.9 seconds later, it seemed like someone had scored too. 
At what time did they/he score each time, and how many points did they/he score each time?

Please list all the scoring information that meets the requirements.

Note:
- Set all NBA quarter breaks to 2 minutes.
- If some players scored at the same time, please list all the scoring information.

Please provide the answer in the following format for each top scorer:
Player1 scored [Points] in [Time]
Player2 scored [Points] in [Time]

For example:
Player1 scored 2 points in (quarter2 10:00)
Player2 scored 3 points in (quarter3 12:00)
...`,
    answer: `Kris Dunn scored 3 in (quarter2 48.1)`,
    checklist: `{
    "Event 1: Kris Dunn scored 3": 0.5,
    "Event 1: Kris Dunn scored in (quarter2 48.1)": 0.5,
    "first_check": {
        "Incorrect player name(s) selected": 0
    }
}`
  },
  "interval-based-event-retrieval": {
    title: "Interval-based Event Retrieval Example",
    question: `GAME INFO
<Time-Play Table>
End of Quarter / Half-time break
</Time-Play Table>
---
Now, your friend has said:
One of my friends was watching this NBA game too, but left to answer a phone call at (quarter1 4:29) and didn't return until (quarter1 2:45). 
Which goals did he miss? Please list the players who scored, when they scored, and how many points they got (including (quarter1 4:29) and (quarter1 2:45)).

Please provide the answer in the following format:
Player1 Name scored [Points] in [Time]
Player2 Name scored [Points] in [Time]

For example:
Player1 Name scored 2 points in (quarter2 10:00)
Player2 Name scored 3 points in (quarter3 12:00)
...`,
    answer: `Devin Vassell scored 2 in (quarter1 4:29)
Nick Richards scored 2 in (quarter1 4:12)
Nick Richards scored 1 in (quarter1 4:12)
Keldon Johnson scored 3 in (quarter1 3:29)
Stephon Castle scored 1 in (quarter1 3:12)
Stephon Castle scored 1 in (quarter1 3:12)
Stephon Castle scored 2 in (quarter1 2:45)`,
    checklist: `{
    "Event 1: Devin Vassell scored 2 in (quarter1 4:29)": 0.14285714285714285,
    "Event 2: Nick Richards scored 2 in (quarter1 4:12)": 0.14285714285714285,
    "Event 3: Nick Richards scored 1 in (quarter1 4:12)": 0.14285714285714285,
    "Event 4: Keldon Johnson scored 3 in (quarter1 3:29)": 0.14285714285714285,
    "Event 5: Stephon Castle scored 1 in (quarter1 3:12)": 0.14285714285714285,
    "Event 6: Stephon Castle scored 1 in (quarter1 3:12)": 0.14285714285714285,
    "Event 7: Stephon Castle scored 2 in (quarter1 2:45)": 0.14285714285714285
}`
  },
  "score-lead-fluctuation-detection": {
    title: "Score Lead Fluctuation Detection Example",
    question: `GAME INFO
<Time-Play Table>
End of Quarter / Half-time break
</Time-Play Table>
---
Now, your friend has said:
In the First quarter, how many times did one team take the lead after previously being behind? At what exact times did these lead changes occur, and which team became the new leader?

Note: A tie does not count as changing the order. If a team that is lagging continuously goes from tying to leading, information on the time of the comeback needs to be recorded.

Please answer using the following format:
In the First quarter, the score order changed [Number] times. The specific time and the leading team are as follows:
At [Time1], [Team1]'s score had surpassed [Team2]'s score, ...`,
    answer: `In the First quarter, the score order changed 1 times. The specific time and the leading team are as follows:
11:30: San Antonio Spurs's score had surpassed Phoenix Suns's`,
    checklist: `{
    "The score order changed 1 times": 0.2,
    "At 11:30, San Antonio Spurs's score had surpassed Phoenix Suns's": 0.8
}`
  },
  "player-performance-impact-analysis": {
    title: "Player Performance Impact Analysis Example",
    question: `GAME INFO
<Time-Play Table>
End of Quarter / Half-time break
</Time-Play Table>
---
Now, your friend has said:
Wow, the Second quarter was really exciting! Both teams performed very well, and the game was very intense. 
Who has scored the most goals from (1 quarter 11:29) to (2 quarter 9:42)(including (1 quarter 11:29) and (2 quarter 9:42))? If he has not made any free throws during this period, which team should be leading now and by how many points? What if all of his goals during this period were not scored?

Note: if multiple players have the same score, please select the player whose name comes first in alphabetical order

Please provide the answer in the following format for the scorer:
The top scorer is [Player Name].
If he has not made any free throws during this period, the leading team should be [Team Name] and the score difference should be [Score Difference].
If all of his goals during this period were not scored, the leading team should be [Team Name] and the score difference should be [Score Difference].`,
    answer: `The top scorer is LeBron James.
If he has not made any free throws during this period, the leading team should be Los Angeles Lakers and the score difference should be 1.
If all of his goals during this period were not scored, the leading team should be LA Clippers and the score difference should be 8.`,
    checklist: `{
    "Without free throws scenario: The leading team is Los Angeles Lakers": 0.25,
    "Without all goals scenario: The leading team is LA Clippers": 0.25,
    "Without free throws scenario: The score difference is 1": 0.25,
    "Without all goals scenario: The score difference is 8": 0.25,
    "first_check": {
        "Incorrect player name(s) selected": 0
    }
}`
  },
  "out-of-context-math-query": {
    title: "Out-of-context Math Query Example",
    question: `GAME INFO
<Time-Play Table>
The competition is ongoing, users are chatting.
</Time-Play Table>
---
Now, your friend has said:
I have a computer science problem to ask you. Please choose the correct answer from the following options and reply with the letter of the option directly:

Another term for out-of-distribution detection is?

A. precision-recall detection
B. underfitting detection
C. bias-variance tradeoff detection
D. regularization detection
E. one-class detection
F. overfitting detection
G. cross-validation detection
H. background detection
I. train-test mismatch robustness
J. anomaly detection
K. outlier detection
L. Both anomaly detection and outlier detection are correct`,
    answer: `L`,
    checklist: `{
    "Correct answer is L": 1.0
}`
  }
};
