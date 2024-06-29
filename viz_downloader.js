/*
PREREQUISITES
- Change download location if necessary (chrome://settings/downloads)
- Disable "ask where to save each file before downloading" / "always ask you where to save files"

USAGE
- Load the viz chapter and open developer console
- Run the following code
  import("https://cdn.jsdelivr.net/gh/tomato57/viz-downloader@v7.0.0/viz_downloader.js").then(function(module) {
      module.downloadChapter()()
  })

NOTES
- Works in chrome version 126.0.6478.127 and firefox version 127.0.2
*/

export const addFuncToProcessChain = (processChain, func) => {
    // reusing processChain results in infinite recursion
    let newProcessChain = () => {
        return new Promise(
            resolve => {
                console.log(`executing func: ${func.name}`)
                func()
                processChain() // gets added to job queue
                resolve(0)
            }
        )
    }
    return newProcessChain
}
export const addSleepToProcessChain = (processChain, timeout) => {
    // reusing processChain results in infinite recursion
    let newprocessChain = () => {
        return new Promise(
            resolve => setTimeout(() => {
                console.log(`waited ms: ${timeout}`)
                processChain() // gets added to job queue
                resolve(0)
            }, timeout)
        )
    }
    return newprocessChain
}
export const buildProcessChain = (processList) => {
    let processChain = () => {
        return new Promise((resolve) => { resolve(0) })
    }
    for (let i = processList.length - 1; i >= 0; i--) {
        processChain = processList[i](processChain)
    }
    return processChain
}
export const getChapterNum = () => {
    return document.title.match(/Chapter\s(\d+)\sManga/)[1]
}
export const getCurrentPageNum = () => {
    return parseInt(document.getElementsByClassName("page_slider_label center")[0].textContent.match(/Pages?:\s(\d+)/)[1])
}
export const getMaxPageNum = () => {
    return parseInt(document.getElementsByClassName("page_slider_label left")[0].textContent.match(/Page\s(\d+)/)[1])
}
export const goLeft = () => {
    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            "keyCode": 37,
            "which": 37,
            "view": window,
        })
    )
}
export const goRight = () => {
    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            "keyCode": 39,
            "which": 39,
            "view": window,
        })
    )
}
export const downloadCurrentImage = () => {
    const chapterNum = getChapterNum()
    const currentPageNum = getCurrentPageNum()
    let leftCanvas = document.getElementById("canvas_left_current")
    let rightCanvas = document.getElementById("canvas_right_current")
    let combined = document.createElement("canvas")
    combined.width = leftCanvas.width + rightCanvas.width
    combined.height = Math.max(leftCanvas.height, rightCanvas.height)
    let context = combined.getContext("2d")
    context.drawImage(leftCanvas, 0, 0)
    context.drawImage(rightCanvas, leftCanvas.width, 0)
    let image = combined.toDataURL("image/png").replace("image/png", "image/octet-stream")
    let link = document.createElement("a")
    link.setAttribute("download", `${chapterNum}_${currentPageNum}.png`)
    link.setAttribute("href", image)
    link.click()
}
export const downloadChapterInfo = () => {
    const chapterNum = getChapterNum()
    const maxPageNum = getMaxPageNum()
    const numImages = (maxPageNum / 2) - 1 // skip ad pages
    const info = {
        "maxPageNum": maxPageNum,
        "numImages": numImages,
    }
    const infoText = JSON.stringify(info)
    let link = document.createElement("a")
    link.setAttribute("download", `${chapterNum}_info.json`)
    link.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(infoText))
    link.click()
}
export const downloadChapter = ({
    passes = 3,
    timeout = 2000,
} = {}) => {
    const maxPageNum = getMaxPageNum()
    let moves = (maxPageNum / 2) - 2 // skip ad pages
    let processList = []
    let index = 0
    processList[index++] = (processChain) => addSleepToProcessChain(processChain, timeout*4)
    for (let m = 0; m < moves + 2; m++) {
        processList[index++] = (processChain) => addFuncToProcessChain(processChain, goRight)
        processList[index++] = (processChain) => addSleepToProcessChain(processChain, timeout)
    }
    for (let p = 0; p < passes - 1; p++) {
        for (let m = 0; m < moves; m++) {
            processList[index++] = (processChain) => addFuncToProcessChain(processChain, goLeft)
            processList[index++] = (processChain) => addSleepToProcessChain(processChain, timeout)
        }
        for (let m = 0; m < moves; m++) {
            processList[index++] = (processChain) => addFuncToProcessChain(processChain, goRight)
            processList[index++] = (processChain) => addSleepToProcessChain(processChain, timeout)
        }
    }
    processList[index++] = (processChain) => addFuncToProcessChain(processChain, downloadCurrentImage)
    for (let m = 0; m < moves; m++) {
        processList[index++] = (processChain) => addFuncToProcessChain(processChain, goLeft)
        processList[index++] = (processChain) => addSleepToProcessChain(processChain, timeout)
        processList[index++] = (processChain) => addFuncToProcessChain(processChain, downloadCurrentImage)
    }
    processList[index++] = (processChain) => addFuncToProcessChain(processChain, downloadChapterInfo)
    return buildProcessChain(processList)
}
