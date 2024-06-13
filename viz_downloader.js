/*
PREREQUISITES
1. open chrome://settings/downloads
   - set download location
   - disable "ask where to save each file before downloading"
2. add extn to overwrite preexisting file instead of adding unwanted suffix to filename
   - https://chromewebstore.google.com/detail/downloads-overwrite-alrea/lddjgfpjnifpeondafidennlcfagekbp

USAGE
1. load the viz chapter and open developer console
2. Run the following
   import("https://cdn.jsdelivr.net/gh/tomato57/viz-downloader@v1.3.0/viz_downloader.js").then(function(module) {
       module.downloadChapter(2000, 500)()
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
export const addSleepToProcessChain = (processChain, timeoutMs) => {
    // reusing processChain results in infinite recursion
    let newprocessChain = () => {
        return new Promise(
            resolve => setTimeout(() => {
                console.log(`waited ms: ${timeoutMs}`)
                processChain() // gets added to job queue
                resolve(0)
            }, timeoutMs)
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
export const getCurrentPage = () => {
    return parseInt(document.getElementsByClassName("page_slider_label center")[0].textContent.match(/Pages?:\s(\d+)/)[1])
}
export const getMaxPage = () => {
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
export const downloadCurrentPage = () => {
    let leftCanvas = document.getElementById("canvas_left_current")
    let rightCanvas = document.getElementById("canvas_right_current")
    // skip last pages with ads
    if (window.getComputedStyle(leftCanvas).getPropertyValue("left") == "0px") {
        let combined = document.createElement("canvas")
        combined.width = leftCanvas.width + rightCanvas.width
        combined.height = leftCanvas.height
        let context = combined.getContext("2d")
        context.drawImage(leftCanvas, 0, 0)
        context.drawImage(rightCanvas, leftCanvas.width, 0)
        let image = combined.toDataURL("image/png").replace("image/png", "image/octet-stream")
        let chapter = document.title.match(/Chapter\s(\d+)\sManga/)[1]
        let page = getCurrentPage()
        let link = document.createElement("a")
        link.setAttribute("download", `${chapter}_${page}.png`)
        link.setAttribute("href", image)
        link.click()
    }
}
export const downloadChapter = (timeoutMsLeft, timeoutMsRight) => {
    let processList = []
    let index = 0
    const currentPage = getCurrentPage()
    const maxPage = getMaxPage()
    if (currentPage > 1) {
        let movesRight = currentPage / 2
        while (movesRight-- > 0) {
            processList[index++] = (processChain) => addFuncToProcessChain(processChain, goRight)
            processList[index++] = (processChain) => addSleepToProcessChain(processChain, timeoutMsRight)
        }
    }
    processList[index++] = (processChain) => addFuncToProcessChain(processChain, downloadCurrentPage)
    let movesLeft = maxPage / 2
    while (movesLeft-- > 0) {
        processList[index++] = (processChain) => addFuncToProcessChain(processChain, goLeft)
        processList[index++] = (processChain) => addSleepToProcessChain(processChain, timeoutMsLeft)
        processList[index++] = (processChain) => addFuncToProcessChain(processChain, downloadCurrentPage)
    }
    return buildProcessChain(processList)
}
// downloadChapter(2000, 500)()
