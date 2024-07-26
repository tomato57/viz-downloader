import os
import re
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--chapter_num", type=int, required=True)
args = parser.parse_args()
chapter_num = args.chapter_num

dl_dir = "/mnt/d/manga/op"
dir_list = os.listdir(dl_dir)
chapter_files = [f for f in dir_list if re.search(f"^{chapter_num}", f) is not None]
for f in chapter_files:
    path = f"{dl_dir}/{f}"
    print("Removing: " + path)
    os.remove(path)
