<div align="center">
<p align="center" width="100%">
<img src="pictures/title.png" width="100%" height="100%">
</p>

<p align="center">
  <a href="https://github.com/syuchin/MARS-Bench/stargazers">
    <img src="https://img.shields.io/github/stars/syuchin/MARS-Bench?style=social"></a>
  <a href="https://yourusername.github.io/MARS-Bench-HomePage/">
    <img src="https://img.shields.io/badge/MARS-Bench-Project Page-green"></a>
  <a href="https://arxiv.org/abs/2505.14552">
    <img src="https://img.shields.io/badge/MARS-Bench-Arxiv-yellow"></a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-Apache--2.0-blue"></a>
</p>
</div>

---

## 🔔 Introduction

<p align="center">
  <img src="pictures/overview.png" alt="MARS-Bench Overview" style="width: 800px;"> 
</p>

**MARS-Bench** is a real-world multi-turn dialogue benchmark that reveals LLM weaknesses in Ultra Multi-turn, Interactive Multi-turn, and Cross-turn Tasks. Built on play-by-play sports commentary, it offers a rigorous evaluation suite and insights into attention sink phenomena and explicit reasoning.

---

## ⚙️ Installation

To install the required packages:

```bash
git clone https://github.com/syuchin/MARS-Bench.git
cd MARS-Bench
# we prefer to run the code in a conda environment
conda create -n mars-bench python=3.10
conda activate mars-bench
pip install -r requirements.txt
```

---

## 🚀 Quick Start

You can quick start like this:

1️⃣ Configure the `config/config.yaml` with your API keys (OpenAI, DeepSeek, etc.).

2️⃣ Run a single-game demo:

```bash
python chat/demo.py --model_name deepseek-chat --game_id 166909 --data_path data/Questions/IF-NBAzh-Dialogue.jsonl
```

3️⃣ Process a specific data file:

```bash
python chat/chat.py --input_file data/Questions/IF-NBAzh-Dialogue.jsonl --model_name deepseek-chat
```

4️⃣ Conduct evaluation:

```bash
python eval/eval.py --input result/chat-result/demo.json --output result/eval-result/demo-eval.json --model_name deepseek-chat
```

---

## 🛠️ Project Structure

### eval

* `eval.py`: Main evaluation script, calculates metrics.
* `deepseek_api.py`: Evaluation-specific DeepSeek API implementation.

### chat

* `chat.py`: Processes full dataset for multi-turn dialogues.
* `demo.py`: Single-game demo script.
* `models/`: Contains model API wrappers (e.g., `deepseek_api.py`, `openai_api.py`).

### data

* `Questions/`: JSON/JSONL files with questions and dialogue data.

### config

* `config.yaml`: API keys and model settings.
* `config_wrapper.py`: Helper for loading configurations.

### result

* `chat-result/`: Dialogue outputs (e.g., `demo.json`).
* `eval-result/`: Evaluation results.
