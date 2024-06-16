/*
PREREQUISITES
1. Open chrome://settings/downloads
   - Change download location if necessary
   - Disable "ask where to save each file before downloading"
2. Add below extension to chrome
   - https://chromewebstore.google.com/detail/downloads-overwrite-alrea/lddjgfpjnifpeondafidennlcfagekbp
   - Downloading will overwrite preexisting file instead of adding suffix to filename

USAGE
1. Load the viz chapter and open developer console
2. Run the following
   import("https://cdn.jsdelivr.net/gh/tomato57/viz-downloader@v1.50.0/viz_downloader.js").then(function(module) {
       module.downloadChapter()()
   })
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
            "view": window,
        })
    )
}
export const goRight = () => {
    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            "keyCode": 39,
            "view": window,
        })
    )
}
export const downloadCurrentImage = () => {
    let leftCanvas = document.getElementById("canvas_left_current")
    let rightCanvas = document.getElementById("canvas_right_current")
    let combined = document.createElement("canvas")
    combined.width = leftCanvas.width + rightCanvas.width
    combined.height = Math.max(leftCanvas.height, rightCanvas.height)
    let context = combined.getContext("2d")
    context.drawImage(leftCanvas, 0, 0)
    context.drawImage(rightCanvas, leftCanvas.width, 0)
    let image = combined.toDataURL("image/png").replace("image/png", "image/octet-stream")
    const chapterNum = getChapterNum()
    const currentPageNum = getCurrentPageNum()
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
    longTimeout = 3000,
    shortTimeout = 1000,
} = {}) => {
    let processList = []
    let index = 0
    const maxPageNum = getMaxPageNum()
    let movesRight = maxPageNum / 2
    let movesLeft = (maxPageNum / 2) - 2 // skip last 2 ad pages
    processList[index++] = (processChain) => addSleepToProcessChain(processChain, longTimeout*2)
    while (movesRight-- > 0) {
        processList[index++] = (processChain) => addFuncToProcessChain(processChain, goRight)
        processList[index++] = (processChain) => addSleepToProcessChain(processChain, shortTimeout)
    }
    processList[index++] = (processChain) => addSleepToProcessChain(processChain, longTimeout)
    processList[index++] = (processChain) => addFuncToProcessChain(processChain, downloadCurrentImage)
    while (movesLeft-- > 0) {
        processList[index++] = (processChain) => addFuncToProcessChain(processChain, goLeft)
        processList[index++] = (processChain) => addSleepToProcessChain(processChain, longTimeout)
        processList[index++] = (processChain) => addFuncToProcessChain(processChain, downloadCurrentImage)
    }
    processList[index++] = (processChain) => addFuncToProcessChain(processChain, downloadChapterInfo)
    return buildProcessChain(processList)
}
// downloadChapter()()
