
// PREREQUISITES
// 1. open chrome://settings/downloads, set location and turn off prompting
// 2. add extn https://chromewebstore.google.com/detail/downloads-overwrite-alrea/lddjgfpjnifpeondafidennlcfagekbp

let addFuncToProcessChain = (processChain, func) => {
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
let addSleepToProcessChain = (processChain, ms) => {
    // reusing processChain results in infinite recursion
    let newprocessChain = () => {
        return new Promise(
            resolve => setTimeout(() => {
                console.log(`waited ms: ${ms}`)
                processChain() // gets added to job queue
                resolve(0)
            }, ms)
        )
    }
    return newprocessChain
}
let buildProcessChain = (processList) => {
    let processChain = () => {
        return new Promise((resolve) => { resolve(0) })
    }
    for (let i = processList.length - 1; i >= 0; i--) {
        processChain = processList[i](processChain)
    }
    return processChain
}

let getCurrentPage = () => {
    return parseInt(document.getElementsByClassName("page_slider_label center")[0].textContent.match(/Pages?:\s(\d+)/)[1])
}
let getMaxPage = () => {
    return parseInt(document.getElementsByClassName("page_slider_label left")[0].textContent.match(/Page\s(\d+)/)[1])
}
let goLeft = () => {
    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            "keyCode": 37,
            "view": window,
        })
    )
}
let goRight = () => {
    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            "keyCode": 39,
            "view": window,
        })
    )
}
let downloadCurrentPage = () => {
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
let downloadChapter = () => {
    let processList = []
    let index = 0
    const currentPage = getCurrentPage()
    const maxPage = getMaxPage()
    if (currentPage > 1) {
        let movesRight = currentPage / 2
        while (movesRight-- > 0) {
            processList[index++] = (processChain) => addFuncToProcessChain(processChain, goRight)
            processList[index++] = (processChain) => addSleepToProcessChain(processChain, 300)
        }
    }
    processList[index++] = (processChain) => addFuncToProcessChain(processChain, downloadCurrentPage)
    let movesLeft = maxPage / 2
    while (movesLeft-- > 0) {
        processList[index++] = (processChain) => addFuncToProcessChain(processChain, goLeft)
        processList[index++] = (processChain) => addSleepToProcessChain(processChain, 1000)
        processList[index++] = (processChain) => addFuncToProcessChain(processChain, downloadCurrentPage)
    }
    return buildProcessChain(processList)
}
// downloadChapter()()
