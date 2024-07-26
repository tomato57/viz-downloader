with open("misc/fill_jsons.txt", "r") as f1:
    for line in f1.readlines():
        line = line.rstrip()
        chapter_num = int(line.split("_")[0])
        max_page_num = int(line.split("_")[1]) + 4
        num_images = int((max_page_num / 2) - 1)
        json_text = "{\"maxPageNum\":" + str(max_page_num) + ",\"numImages\":" + str(num_images) + "}"
        with open(f"misc/jsons/{chapter_num}_info.json", "w") as f2:
            f2.write(json_text)
