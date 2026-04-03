import re
import time
from deep_translator import GoogleTranslator
import json

with open('src/tasks.js', 'r', encoding='utf-8') as f:
    text = f.read()

translator = GoogleTranslator(source='ru', target='en')

def safe_translate(val):
    if not val or len(val) < 2: return val
    try:
        time.sleep(0.3)
        return translator.translate(val).replace('"', "'")
    except Exception as e:
        print("Ошибка перевода:", e)
        return val

lines = text.split('\n')
for i in range(len(lines)):
    line = lines[i]
    if 'title: "' in line and 'title_en' not in lines[i+1]:
        m = re.search(r'title:\s*"([^"]+)"', line)
        if m:
            tr = safe_translate(m.group(1))
            lines[i] = line + f'\n    title_en: "{tr}",'
            print(f"Translating title: {tr}")
            
    if 'teaser: "' in line and 'teaser_en' not in lines[i+1]:
        m = re.search(r'teaser:\s*"([^"]+)"', line)
        if m:
            tr = safe_translate(m.group(1))
            lines[i] = line + f'\n    teaser_en: "{tr}",'

    if 'question_ru: "' in line:
        m = re.search(r'question_ru:\s*"([^"]+)"', line)
        if m and ('question_en: ""' in line or 'question_en' not in line):
            tr = safe_translate(m.group(1))
            lines[i] = re.sub(r'question_en:\s*""', f'question_en: "{tr}"', lines[i])
            print(f"Translating q: {tr}")
            
    if 'answer_ru: "' in line:
        m = re.search(r'answer_ru:\s*"([^"]+)"', line)
        if m and ('answer_en: ""' in line or 'answer_en' not in line):
            tr = safe_translate(m.group(1))
            lines[i] = re.sub(r'answer_en:\s*""', f'answer_en: "{tr}"', lines[i])

with open('src/tasks.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print("Перевод завершен!")
