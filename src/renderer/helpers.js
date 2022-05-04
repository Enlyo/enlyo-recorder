/**
 * Convert buffer to file
 */
export function convertBufferToFile(buffer, name) {
    let blob = new Blob([buffer]);
    let file = new File([blob], name);
    return file;
}
