import os
import re
import json

dir_list = os.listdir("/mnt/d/manga/op")
jsons = [f for f in dir_list if re.search("\.json$", f) is not None]
for j in jsons:
    chapter_num = int(j.split("_")[0])
    num_files = len([f for f in dir_list if re.search(f"^{chapter_num}", f) is not None])
    with open(f"/mnt/d/manga/op/{j}", "r") as f:
        info = json.loads(f.read())
        num_images = info["numImages"]
        assert (num_files - 1) == num_images, print(chapter_num, num_files, num_images)
