export function showMessage(messageId: string) {
  const $i = document.getElementById.bind(document);
  $i(messageId)!.classList.remove("opaque");
  setTimeout(() => $i(messageId)!.classList.add("opaque"), 2500);
}
