import glob
import json


files = sorted(glob.glob("C:/Brayden/Project/public/all_exams.json/*.json"))
all_questions = []

for file_path in files:
    with open(file_path, encoding="utf-8") as file:
        data = json.load(file)
        if isinstance(data, list):
            all_questions.extend(data)
        else:
            all_questions.append(data)

with open(
    "C:/Brayden/Project/public/all_questions.json",
    "w",
    encoding="utf-8",
) as output:
    json.dump(all_questions, output, ensure_ascii=False, indent=2)

print(f"총 {len(all_questions)}문제 합치기 완료")
