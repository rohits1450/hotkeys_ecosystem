import browser from "webextension-polyfill";

interface WriteImageClipboardMessage {
  type: "write-image-clipboard";
  dataUrl: string;
}

function isWriteImageClipboardMessage(msg: unknown): msg is WriteImageClipboardMessage {
  return typeof msg === "object" && msg !== null && (msg as { type?: unknown }).type === "write-image-clipboard";
}

browser.runtime.onMessage.addListener((message) => {
  if (!isWriteImageClipboardMessage(message)) return undefined;
  return (async () => {
    const response = await fetch(message.dataUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
  })();
});
