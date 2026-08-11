/** Open a print-ready window so the user can Print or Save as PDF (Acrobat / system PDF). */
export async function printHtmlDocument(title: string, bodyHtml: string, extraCss = "") {
  // Avoid "noopener" so we keep a window handle and can wait for images before print.
  const win = window.open("", "_blank", "width=820,height=1100");
  if (!win) {
    // Popup blocked — fall back to printing current page content if possible.
    window.print();
    return;
  }

  const safeTitle = title.replace(/[<>]/g, "");

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    ${extraCss}
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`);
  win.document.close();

  // Wait until document + images are ready so Acrobat/PDF capture includes the logo.
  await waitForPrintReady(win);

  try {
    win.focus();
    win.print();
  } catch {
    // ignore
  }
}

function waitForPrintReady(win: Window): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => resolve();
    const timeout = window.setTimeout(finish, 2500);

    const run = async () => {
      const imgs = Array.from(win.document.images || []);
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((res) => {
              if (img.complete && img.naturalWidth > 0) {
                res();
                return;
              }
              img.onload = () => res();
              img.onerror = () => res();
              // Safety if neither fires
              window.setTimeout(() => res(), 1500);
            })
        )
      );
      // One frame for layout after images
      await new Promise((r) => window.setTimeout(r, 150));
      window.clearTimeout(timeout);
      finish();
    };

    if (win.document.readyState === "complete") {
      void run();
    } else {
      win.addEventListener("load", () => void run(), { once: true });
    }
  });
}
